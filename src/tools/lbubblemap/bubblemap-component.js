import * as utils from "base/utils";
import Component from "base/component";
import Labels from "helpers/labels";
import {
  warn as iconWarn,
  question as iconQuestion
} from "base/iconset";

import DynamicBackground from "helpers/d3.dynamicBackground";
import globals from "base/globals";
import MapEngine from "tools/lbubblemap/bubblemap-map";

//import Selectlist from 'bubblemap-selectlist';

//BUBBLE MAP CHART COMPONENT
const LBubbleMapComponent = Component.extend({
  /**
   * Initializes the component (Bubble Map Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init(config, context) {
    this.name = "bubblemap";
    this.template = require("./bubblemap.html");
    this.bubblesDrawing = null;


    this.isMobile = utils.isMobileOrTablet();

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }, {
      name: "ui",
      type: "ui"
    }];

    const _this = this;
    this.model_binds = {
      "change:time.value": function(evt) {
        if (!_this._readyOnce) return;
        _this.model.marker.getFrame(_this.model.time.value, _this.frameChanged.bind(_this));
      },
      "change:marker.highlight": function(evt) {
        if (!_this._readyOnce) return;
        _this.highlightMarkers();
        _this.updateOpacity();
      },
      "change:marker": function(evt, path) {
        // bubble size change is processed separately
        if (!_this._readyOnce) return;

        if (path.indexOf("scaleType") > -1) {
          _this.ready();
        }
      },
      "change:marker.size.extent": function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if (!_this._readyOnce || !_this.entityBubbles) return;
        _this.updateMarkerSizeLimits();
        _this.redrawDataPoints(null, false);
      },
      "change:marker.color.palette": function(evt, path) {
        if (!_this._readyOnce) return;
        _this.redrawDataPoints(null, false);
      },
      "change:marker.select": function(evt) {
        if (!_this._readyOnce) return;
        _this.selectMarkers();
        _this.redrawDataPoints(null, false);
        _this.updateOpacity();
        _this.updateDoubtOpacity();

      },
      "change:marker.opacitySelectDim": function(evt) {
        _this.updateOpacity();
      },
      "change:marker.opacityRegular": function(evt) {
        _this.updateOpacity();
      },
      "change:ui.map.mapLayer": function(evt) {
        _this.map.layerChanged();
      }
    };

    //this._selectlist = new Selectlist(this);

    //contructor is the same as any component
    this._super(config, context);

    this.sScale = null;
    this.cScale = d3.scaleOrdinal(d3.schemeCategory10);

    _this.COLOR_WHITEISH = "#fdfdfd";


    this._labels = new Labels(this);

    this._labels.config({
      CSS_PREFIX: "vzb-bmc",
      LABELS_CONTAINER_CLASS: "vzb-bmc-labels",
      LINES_CONTAINER_CLASS: "vzb-bmc-lines",
      SUPPRESS_HIGHLIGHT_DURING_PLAY: false
    });
  },


  /**
   * DOM is ready
   */
  readyOnce() {
    this.element = d3.select(this.element);

    this.graph = this.element.select(".vzb-bmc-graph");

    this.bubbleContainerCrop = this.graph.select(".vzb-bmc-bubbles-crop");
    this.bubbleContainer = this.graph.select(".vzb-bmc-bubbles");
    this.labelListContainer = this.graph.select(".vzb-bmc-bubble-labels");
    this.dataWarningEl = this.graph.select(".vzb-data-warning");

    this.yTitleEl = this.graph.select(".vzb-bmc-axis-y-title");
    this.cTitleEl = this.graph.select(".vzb-bmc-axis-c-title");
    this.yInfoEl = this.graph.select(".vzb-bmc-axis-y-info");
    this.cInfoEl = this.graph.select(".vzb-bmc-axis-c-info");

    this.entityBubbles = null;
    this.tooltip = this.element.select(".vzb-bmc-tooltip");

    // year background
    this.yearEl = this.graph.select(".vzb-bmc-year");
    this.year = new DynamicBackground(this.yearEl);
    this.year.setConditions({ xAlign: "left", yAlign: "bottom" });

    const _this = this;
    this.on("resize", () => {
      //return if updatesize exists with error
      if (_this.updateSize()) return;
      _this.map.rescaleMap();
    });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.updateUIStrings();

    this.wScale = d3.scale.linear()
        .domain(this.model.ui.datawarning.doubtDomain)
        .range(this.model.ui.datawarning.doubtRange);

    this._labels.readyOnce();
  },

  /*
   * Both model and DOM are ready
   */
  ready() {
    const _this = this;
    this.updateUIStrings();
    this.updateIndicators();
    this.updateSize();
    this.map.rescaleMap();
    this.updateMarkerSizeLimits();
    this.model.marker.getFrame(this.model.time.value, (values, time) => {
      // TODO: temporary fix for case when after data loading time changed on validation
      if (time.toString() != _this.model.time.value.toString()) {
        utils.defer(() => {
          _this.ready();
        });
        return;
      } // frame is outdated

      if (!values) return;
      _this.values = values;
      _this.updateEntities();
      _this.updateTime();
      _this._labels.ready();
      _this.redrawDataPoints();
      _this.highlightMarkers();
      _this.selectMarkers();
//    this._selectlist.redraw();
      _this.updateDoubtOpacity();
      _this.updateOpacity();
    });

  },

  frameChanged(frame, time) {
    if (time.toString() != this.model.time.value.toString()) return; // frame is outdated
    if (!frame) return;

    this.values = frame;
    this.updateTime();
    this.updateDoubtOpacity();
    this.redrawDataPoints(null, false);

  },

  updateUIStrings() {
    const _this = this;

    this.translator = this.model.locale.getTFunction();
    const conceptPropsS = _this.model.marker.size.getConceptprops();
    const conceptPropsC = _this.model.marker.color.getConceptprops();

    this.strings = {
      title: {
        S: conceptPropsS.name,
        C: conceptPropsC.name
      }
    };

    this.yTitleEl.select("text")
      .text(this.translator("buttons/size") + ": " + this.strings.title.S)
      .on("click", () => {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("size")
          .alignX(_this.model.locale.isRTL() ? "right" : "left")
          .alignY("top")
          .updateView()
          .toggle();
      });

    this.cTitleEl.select("text")
      .text(this.translator("buttons/color") + ": " + this.strings.title.C)
      .on("click", () => {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("color")
          .alignX(_this.model.locale.isRTL() ? "right" : "left")
          .alignY("top")
          .updateView()
          .toggle();
      });

    utils.setIcon(this.dataWarningEl, iconWarn).select("svg").attr("width", "0px").attr("height", "0px");
    this.dataWarningEl.append("text")
      .attr("text-anchor", "end")
      .text(this.translator("hints/dataWarning"));

    this.dataWarningEl
      .on("click", () => {
        _this.parent.findChildByName("gapminder-datawarning").toggle();
      })
      .on("mouseover", () => {
        _this.updateDoubtOpacity(1);
      })
      .on("mouseout", () => {
        _this.updateDoubtOpacity();
      });

    this.yInfoEl
      .html(iconQuestion)
      .select("svg").attr("width", "0px").attr("height", "0px");

    //TODO: move away from UI strings, maybe to ready or ready once
    this.yInfoEl.on("click", () => {
      _this.parent.findChildByName("gapminder-datanotes").pin();
    });
    this.yInfoEl.on("mouseover", function() {
      const rect = this.getBBox();
      const coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      const toolRect = _this.root.element.getBoundingClientRect();
      const chartRect = _this.element.node().getBoundingClientRect();
      _this.parent.findChildByName("gapminder-datanotes").setHook("size").show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
    });
    this.yInfoEl.on("mouseout", () => {
      _this.parent.findChildByName("gapminder-datanotes").hide();
    });

    this.cInfoEl
      .html(iconQuestion)
      .select("svg").attr("width", "0px").attr("height", "0px");

    //TODO: move away from UI strings, maybe to ready or ready once
    this.cInfoEl.on("click", () => {
      _this.parent.findChildByName("gapminder-datanotes").pin();
    });
    this.cInfoEl.on("mouseover", function() {
      const rect = this.getBBox();
      const coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      const toolRect = _this.root.element.getBoundingClientRect();
      const chartRect = _this.element.node().getBoundingClientRect();
      _this.parent.findChildByName("gapminder-datanotes").setHook("color").show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
    });
    this.cInfoEl.on("mouseout", () => {
      _this.parent.findChildByName("gapminder-datanotes").hide();
    });
  },

  // show size number on title when hovered on a bubble
  updateTitleNumbers() {
    const _this = this;

    let mobile; // if is mobile device and only one bubble is selected, update the ytitle for the bubble
    if (_this.isMobile && _this.model.marker.select && _this.model.marker.select.length === 1) {
      mobile = _this.model.marker.select[0];
    }

    if (_this.hovered || mobile) {
      const conceptPropsS = _this.model.marker.size.getConceptprops();
      const conceptPropsC = _this.model.marker.color.getConceptprops();

      const hovered = _this.hovered || mobile;
      const formatterS = _this.model.marker.size.getTickFormatter();
      const formatterC = _this.model.marker.color.getTickFormatter();

      const unitS = conceptPropsS.unit || "";
      const unitC = conceptPropsC.unit || "";

      const valueS = _this.values.size[hovered[_this.KEY]];
      let valueC = _this.values.color[hovered[_this.KEY]];

      //resolve value for color from the color legend model
      if (_this.model.marker.color.isDiscrete() && valueC) {
        valueC = this.model.marker.color.getColorlegendMarker().label.getItems()[valueC] || "";
      }

      _this.yTitleEl.select("text")
        .text(_this.translator("buttons/size") + ": " + formatterS(valueS) + " " + unitS);

      _this.cTitleEl.select("text")
        .text(_this.translator("buttons/color") + ": " +
          (valueC || valueC === 0 ? formatterC(valueC) + " " + unitC : _this.translator("hints/nodata")));

      this.yInfoEl.classed("vzb-hidden", true);
      this.cInfoEl.classed("vzb-hidden", true);
    } else {
      this.yTitleEl.select("text")
        .text(this.translator("buttons/size") + ": " + this.strings.title.S);
      this.cTitleEl.select("text")
        .text(this.translator("buttons/color") + ": " + this.strings.title.C);

      this.yInfoEl.classed("vzb-hidden", false);
      this.cInfoEl.classed("vzb-hidden", false || this.cTitleEl.classed("vzb-hidden"));
    }
  },

  updateDoubtOpacity(opacity) {
    if (opacity == null) opacity = this.wScale(+this.time.getUTCFullYear().toString());
    if (this.someSelected) opacity = 1;
    this.dataWarningEl.style("opacity", opacity);
  },

  updateOpacity() {
    const _this = this;
    /*
     this.entityBubbles.classed("vzb-selected", function (d) {
     return _this.model.marker.isSelected(d);
     });
     */

    const OPACITY_HIGHLT = 1.0;
    const OPACITY_HIGHLT_DIM = 0.3;
    const OPACITY_SELECT = this.model.marker.opacityRegular;
    const OPACITY_REGULAR = this.model.marker.opacityRegular;
    const OPACITY_SELECT_DIM = this.model.marker.opacitySelectDim;

    this.entityBubbles.style("opacity", d => {

      if (_this.someHighlighted) {
        //highlight or non-highlight
        if (_this.model.marker.isHighlighted(d)) return OPACITY_HIGHLT;
      }

      if (_this.someSelected) {
        //selected or non-selected
        return _this.model.marker.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
      }

      if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

      return OPACITY_REGULAR;

    });

    this.entityBubbles.classed("vzb-selected", d => _this.model.marker.isSelected(d));

    const nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < 0.01;

    // when pointer events need update...
    if (nonSelectedOpacityZero !== this.nonSelectedOpacityZero) {
      this.entityBubbles.style("pointer-events", d => (!_this.someSelected || !nonSelectedOpacityZero || _this.model.marker.isSelected(d)) ?
            "visible" : "none");
    }

    this.nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < 0.01;
  },

  /**
   * Changes labels for indicators
   */
  updateIndicators() {
    this.sScale = this.model.marker.size.getScale();
    this.cScale = this.model.marker.color.getScale();
  },

  /**
   * Updates entities
   */
  updateEntities() {

    const _this = this;
    const KEY = this.KEY;
    const TIMEDIM = this.TIMEDIM;

    const getKeys = function(prefix) {
      prefix = prefix || "";
      return _this.model.marker.getKeys()
        .map(d => {
          const pointer = {};
          pointer[KEY] = d[KEY];
          pointer[TIMEDIM] = endTime;
          pointer.sortValue = _this.values.size[d[KEY]] || 0;
          pointer[KEY] = prefix + d[KEY];
          return pointer;
        })
        .sort((a, b) => b.sortValue - a.sortValue);
    };

    // get array of GEOs, sorted by the size hook
    // that makes larger bubbles go behind the smaller ones
    const endTime = this.model.time.end;
    this.model.marker.setVisible(getKeys.call(this));

    //unselecting bubbles with no data is used for the scenario when
    //some bubbles are selected and user would switch indicator.
    //bubbles would disappear but selection would stay
    if (!this.model.time.splash) {
      this.unselectBubblesWithNoData();
    }

    // TODO: add to csv
    //Africa 9.1021° N, 18.2812°E
    //Europe 53.0000° N, 9.0000° E
    //Asia 49.8380° N, 105.8203° E
    //north American 48.1667° N and longitude 100.1667° W
    /*
     var pos = {
     "afr": {lat: 9.1, lng: 18.3},
     "eur": {lat: 53.0, lng: 9.0},
     "asi": {lat: 49.8, lng: 105.8},
     "ame": {lat: 48.2, lng: -100.2},
     };
     */


    this.entityBubbles = this.bubbleContainer.selectAll(".vzb-bmc-bubble")
        .data(this.model.marker.getVisible(), d => d[KEY])
        .order();

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles = this.entityBubbles.enter().append("circle")
        .attr("class", "vzb-bmc-bubble")
        .on("mouseover", (d, i) => {
          if (utils.isTouchDevice()) return;
          _this._interact()._mouseover(d, i);
        })
        .on("mouseout", (d, i) => {
          if (utils.isTouchDevice()) return;
          _this._interact()._mouseout(d, i);
        })
        .on("click", (d, i) => {
          if (utils.isTouchDevice()) return;
          _this._interact()._click(d, i);
          _this.highlightMarkers();
        })
        .onTap((d, i) => {
          _this._interact()._click(d, i);
          d3.event.stopPropagation();
        })
        .onLongTap((d, i) => {
        })
        .merge(this.entityBubbles);

  },

  unselectBubblesWithNoData(frame) {
    const _this = this;
    const KEY = this.KEY;
    if (!frame) frame = this.values;

    if (!frame || !frame.size) return;

    this.model.marker.select.forEach(d => {
      if (!frame.size[d[KEY]] && frame.size[d[KEY]] !== 0)
        _this.model.marker.selectMarker(d);
    });
  },

  redrawDataPoints(duration, reposition) {
    const _this = this;
    if (!duration) duration = this.duration;
    if (!reposition) reposition = true;
    if (!this.entityBubbles) return utils.warn("redrawDataPoints(): no entityBubbles defined. likely a premature call, fix it!");
    this.entityBubbles.each(function(d, index) {
      const view = d3.select(this);
      const geo = d3.select("#" + d[_this.KEY]);

      const valueX = _this.values.hook_lng[d[_this.KEY]];
      const valueY = _this.values.hook_lat[d[_this.KEY]];
      const valueS = _this.values.size[d[_this.KEY]];
      const valueC = _this.values.color[d[_this.KEY]];
      const valueL = _this.values.label[d[_this.KEY]];

      d.hidden_1 = d.hidden;
      d.hidden = (!valueS && valueS !== 0) || valueX == null || valueY == null;


      if (d.hidden !== d.hidden_1) {
        if (duration) {
          view.transition().duration(duration).ease(d3.easeLinear)
            .style("opacity", 0)
            .on("end", () => view.classed("vzb-hidden", d.hidden).style("opacity", _this.model.marker.opacityRegular));
        } else {
          view.classed("vzb-hidden", d.hidden);
        }
      }
      if (!d.hidden) {

        d.r = utils.areaToRadius(_this.sScale(valueS || 0));
        d.label = valueL;

        view.classed("vzb-hidden", false)
          .attr("fill", valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH);

        if (_this.model.ui.map.colorGeo)
          geo.style("fill", valueC != null ? _this.cScale(valueC) : "#999");

        if (reposition) {
          d.cLoc = _this.map.invert(valueX, valueY);

          view.attr("cx", d.cLoc[0])
            .attr("cy", d.cLoc[1]);
        }

        if (duration) {
          view.transition().duration(duration).ease(d3.easeLinear)
            .attr("r", d.r);
        } else {
          view.interrupt()
            .attr("r", d.r)
            .transition();
        }

        _this._updateLabel(d, index, d.cLoc[0], d.cLoc[1], valueS, valueC, d.label, duration);
      } else {
        _this._updateLabel(d, index, 0, 0, valueS, valueC, valueL, duration);
      }

    });
  },

  /*
   * UPDATE TIME:
   * Ideally should only update when time or data changes
   */
  updateTime() {
    const _this = this;

    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;
    this.year.setText(this.model.time.formatDate(this.time), this.duration);

    //possibly update the exact value in size title
    this.updateTitleNumbers();
  },


  fitSizeOfTitles() {
    // reset font sizes first to make the measurement consistent
    const yTitleText = this.yTitleEl.select("text");
    yTitleText.style("font-size", null);

    const cTitleText = this.cTitleEl.select("text");
    cTitleText.style("font-size", null);

    const yTitleBB = yTitleText.node().getBBox();
    const cTitleBB = this.cTitleEl.classed("vzb-hidden") ? yTitleBB : cTitleText.node().getBBox();

    const font =
        Math.max(parseInt(yTitleText.style("font-size")), parseInt(cTitleText.style("font-size")))
        * this.width / Math.max(yTitleBB.width, cTitleBB.width);

    if (Math.max(yTitleBB.width, cTitleBB.width) > this.width) {
      yTitleText.style("font-size", font + "px");
      cTitleText.style("font-size", font + "px");
    } else {

      // Else - reset the font size to default so it won't get stuck
      yTitleText.style("font-size", null);
      cTitleText.style("font-size", null);
    }

  },

  profiles: {
    small: {
      margin: { top: 10, right: 10, left: 10, bottom: 0 },
      infoElHeight: 16,
      minRadius: 0.5,
      maxRadius: 30
    },
    medium: {
      margin: { top: 20, right: 20, left: 20, bottom: 30 },
      infoElHeight: 20,
      minRadius: 1,
      maxRadius: 55
    },
    large: {
      margin: { top: 30, right: 30, left: 30, bottom: 35 },
      infoElHeight: 22,
      minRadius: 1,
      maxRadius: 65
    }
  },

  presentationProfileChanges: {
    medium: {
      infoElHeight: 26
    },
    large: {
      infoElHeight: 32
    }
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  updateSize() {

    this.activeProfile = this.getActiveProfile(this.profiles, this.presentationProfileChanges);
    const margin = this.activeProfile.margin;

    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if (this.height <= 0 || this.width <= 0) return utils.warn("Bubble map updateSize() abort: vizabi container is too little or has display:none");

    this.repositionElements();
  },

  mapBoundsChanged() {
    this.updateMarkerSizeLimits();
    this._labels.updateSize();
    this.redrawDataPoints();
    //_this._selectlist.redraw();

  },

  repositionElements() {
    const margin = this.activeProfile.margin;
    const infoElHeight = this.activeProfile.infoElHeight;
    const isRTL = this.model.locale.isRTL();

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.setConditions({
      widthRatio: 2 / 10
    });
    this.year.resize(this.width, this.height);

    this.yTitleEl
      .style("font-size", infoElHeight)
      .attr("transform", "translate(" + (isRTL ? this.width : 0) + "," + margin.top + ")");

    const yTitleBB = this.yTitleEl.select("text").node().getBBox();

    //hide the second line about color in large profile or when color is constant
    this.cTitleEl.attr("transform", "translate(" + (isRTL ? this.width : 0) + "," + (margin.top + yTitleBB.height) + ")")
      .classed("vzb-hidden", this.getLayoutProfile() === "large" || this.model.marker.color.use == "constant");

    const warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
      .attr("width", warnBB.height * 0.75)
      .attr("height", warnBB.height * 0.75)
      .attr("x", -warnBB.width - warnBB.height * 1.2)
      .attr("y", -warnBB.height * 0.65);

    this.dataWarningEl
      .attr("transform", "translate(" + (this.width) + "," + (this.height - warnBB.height * 0.5) + ")")
      .select("text");

    if (this.yInfoEl.select("svg").node()) {
      const titleBBox = this.yTitleEl.node().getBBox();
      const t = utils.transform(this.yTitleEl.node());
      const hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * 0.4);

      this.yInfoEl.select("svg")
        .attr("width", infoElHeight)
        .attr("height", infoElHeight);
      this.yInfoEl.attr("transform", "translate("
          + hTranslate + ","
          + (t.translateY - infoElHeight * 0.8) + ")");
    }

    this.cInfoEl.classed("vzb-hidden", this.cTitleEl.classed("vzb-hidden"));

    if (!this.cInfoEl.classed("vzb-hidden") && this.cInfoEl.select("svg").node()) {
      const titleBBox = this.cTitleEl.node().getBBox();
      const t = utils.transform(this.cTitleEl.node());
      const hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * 0.4);

      this.cInfoEl.select("svg")
        .attr("width", infoElHeight)
        .attr("height", infoElHeight);
      this.cInfoEl.attr("transform", "translate("
          + hTranslate + ","
          + (t.translateY - infoElHeight * 0.8) + ")");
    }
  },


  updateMarkerSizeLimits() {
    const _this = this;
    const extent = this.model.marker.size.extent || [0, 1];

    const minRadius = this.activeProfile.minRadius;
    const maxRadius = this.activeProfile.maxRadius;

    this.minRadius = Math.max(maxRadius * extent[0], minRadius);
    this.maxRadius = Math.max(maxRadius * extent[1], minRadius);

    if (this.model.marker.size.scaleType !== "ordinal") {
      this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
    } else {
      this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
    }

  },

  _interact() {
    const _this = this;

    return {
      _mouseover(d, i) {
        if (_this.model.time.dragging) return;

        _this.model.marker.highlightMarker(d);

        _this.hovered = d;
        //put the exact value in the size title
        _this.updateTitleNumbers();
        _this.fitSizeOfTitles();

        if (_this.model.marker.isSelected(d)) { // if selected, not show hover tooltip
          _this._setTooltip();
        } else {
          //position tooltip
          _this._setTooltip(d);
        }
      },
      _mouseout(d, i) {
        if (_this.model.time.dragging) return;
        _this._setTooltip();
        _this.hovered = null;
        _this.updateTitleNumbers();
        _this.fitSizeOfTitles();
        _this.model.marker.clearHighlighted();
      },
      _click(d, i) {
        _this.model.marker.selectMarker(d);
      }
    };

  },


  highlightMarkers() {
    const _this = this;
    this.someHighlighted = (this.model.marker.highlight.length > 0);

    if (utils.isTouchDevice()) {
      if (this.someHighlighted) {
        _this.hovered = this.model.marker.highlight[0];
      } else {
        _this.hovered = null;
      }
      _this.updateTitleNumbers();
      _this.fitSizeOfTitles();
    }


//      if (!this.selectList || !this.someSelected) return;
//      this.selectList.classed("vzb-highlight", function (d) {
//          return _this.model.entities.isHighlighted(d);
//      });
//      this.selectList.each(function (d, i) {
//        d3.select(this).selectAll(".vzb-bmc-label-x")
//          .classed("vzb-invisible", function(n) {
//            return !_this.model.entities.isHighlighted(d);
//          });
//
//      });

  },

  _updateLabel(d, index, valueX, valueY, valueS, valueC, valueL, duration) {
    const _this = this;
    const KEY = this.KEY;
    if (d[KEY] == _this.druging) return;
    if (duration == null) duration = _this.duration;

    // only for selected entities
    if (_this.model.marker.isSelected(d)) {

      const showhide = d.hidden !== d.hidden_1;
      const valueLST = null;
      const cache = {};
      cache.labelX0 = valueX / this.width;
      cache.labelY0 = valueY / this.height;
      cache.scaledS0 = valueS ? utils.areaToRadius(_this.sScale(valueS)) : null;
      cache.scaledC0 = valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH;

      this._labels.updateLabel(d, index, cache, valueX / this.width, valueY / this.height, valueS, valueC, valueL, valueLST, duration, showhide);
    }
  },

  selectMarkers() {
    const _this = this;
    const KEY = this.KEY;
    this.someSelected = (this.model.marker.select.length > 0);

//      this._selectlist.rebuild();
    if (utils.isTouchDevice()) {
      _this._labels.showCloseCross(null, false);
      if (_this.someHighlighted) {
        _this.model.marker.clearHighlighted();
      } else {
        _this.updateTitleNumbers();
        _this.fitSizeOfTitles();
      }
    } else {
      // hide recent hover tooltip
      if (!_this.hovered || _this.model.marker.isSelected(_this.hovered)) {
        _this._setTooltip();
      }
    }

    this.nonSelectedOpacityZero = false;
  },

  _setTooltip(d) {
    const _this = this;
    if (d) {
      const tooltipText = d.label;
      let x = d.cLoc[0];
      let y = d.cLoc[1];
      const offset = d.r;
      const mouse = d3.mouse(this.graph.node()).map(d => parseInt(d));
      let xPos, yPos, xSign = -1,
        ySign = -1,
        xOffset = 0,
        yOffset = 0;

      if (offset) {
        xOffset = offset * 0.71; // .71 - sin and cos for 315
        yOffset = offset * 0.71;
      }
      //position tooltip
      this.tooltip.classed("vzb-hidden", false)
        //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
        .selectAll("text")
        .text(tooltipText);

      const contentBBox = this.tooltip.select("text").node().getBBox();
      if (x - xOffset - contentBBox.width < 0) {
        xSign = 1;
        x += contentBBox.width + 5; // corrective to the block Radius and text padding
      } else {
        x -= 5; // corrective to the block Radius and text padding
      }
      if (y - yOffset - contentBBox.height < 0) {
        ySign = 1;
        y += contentBBox.height;
      } else {
        y -= 11; // corrective to the block Radius and text padding
      }
      if (offset) {
        xPos = x + xOffset * xSign;
        yPos = y + yOffset * ySign; // 5 and 11 - corrective to the block Radius and text padding
      } else {
        xPos = x + xOffset * xSign; // .71 - sin and cos for 315
        yPos = y + yOffset * ySign; // 5 and 11 - corrective to the block Radius and text padding
      }
      this.tooltip.attr("transform", "translate(" + (xPos ? xPos : mouse[0]) + "," + (yPos ? yPos : mouse[1]) +
          ")");

      this.tooltip.select("rect").attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * 0.85)
        .attr("rx", contentBBox.height * 0.2)
        .attr("ry", contentBBox.height * 0.2);


    } else {

      this.tooltip.classed("vzb-hidden", true);
    }
  },

  preload() {
    this.initMap();
  },

  initMap() {
    this.map = new MapEngine(this, "#vzb-map-background").getMap();
    return this.map.initMap();
  }
});

export default LBubbleMapComponent;
