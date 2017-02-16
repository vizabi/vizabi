import * as utils from 'base/utils';
import Component from 'base/component';
import Labels from 'helpers/labels';
import {
  warn as iconWarn,
  question as iconQuestion
} from 'base/iconset';

import topojson from 'helpers/topojson';
import d3_geo_projection from 'helpers/d3.geoProjection';
import DynamicBackground from 'helpers/d3.dynamicBackground';
import globals from 'base/globals';

//import Selectlist from 'bubblemap-selectlist';

//BUBBLE MAP CHART COMPONENT
var BubbleMapComponent = Component.extend({
  /**
   * Initializes the component (Bubble Map Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init: function (config, context) {
    this.name = 'bubblemap';
    this.template = require('./bubblemap.html');
    this.bubblesDrawing = null;


    //http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
    var mobileAndTabletcheck = function() {
      var check = false;
      (function(a) {if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true;})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    };
    this.isMobile = mobileAndTabletcheck();

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

    var _this = this;
    this.model_binds = {
      "change:time.value": function (evt) {
        if (!_this._readyOnce) return;
        _this.model.marker.getFrame(_this.model.time.value, _this.frameChanged.bind(_this));
      },
      "change:marker.highlight": function (evt) {
        if (!_this._readyOnce) return;
        _this.highlightMarkers();
        _this.updateOpacity();
      },
      "change:marker": function(evt, path) {
        // bubble size change is processed separately
        if(!_this._readyOnce) return;

        if(path.indexOf("scaleType") > -1) {
          _this.ready();
        }
      },
      'change:marker.size.extent': function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce || !_this.entityBubbles) return;
        _this.updateMarkerSizeLimits();
        _this.redrawDataPoints(null, false);
      },
      "change:marker.color.palette": function (evt, path) {
          if (!_this._readyOnce) return;
          _this.redrawDataPoints(null, false);
      },
      "change:marker.select": function (evt) {
          if (!_this._readyOnce) return;
          _this.selectMarkers();
          _this.redrawDataPoints(null, false);
          _this.updateOpacity();
          _this.updateDoubtOpacity();

      },
      "change:marker.opacitySelectDim": function (evt) {
          _this.updateOpacity();
      },
      "change:marker.opacityRegular": function (evt) {
          _this.updateOpacity();
      },
    };

    //this._selectlist = new Selectlist(this);

    //contructor is the same as any component
    this._super(config, context);

    this.sScale = null;
    this.cScale = d3.scaleOrdinal(d3.schemeCategory10);

    _this.COLOR_WHITEISH = "#fdfdfd";

    d3_geo_projection();

    this._labels = new Labels(this);
    this._labels.config({
      CSS_PREFIX: 'vzb-bmc',
      LABELS_CONTAINER_CLASS: 'vzb-bmc-labels',
      LINES_CONTAINER_CLASS: 'vzb-bmc-lines',
      SUPPRESS_HIGHLIGHT_DURING_PLAY: false
    });
  },


  /**
   * DOM is ready
   */
  readyOnce: function () {

    this.element = d3.select(this.element);

    this.graph = this.element.select('.vzb-bmc-graph');
    this.mapSvg = this.element.select('.vzb-bmc-map-background');

    this.bubbleContainerCrop = this.graph.select('.vzb-bmc-bubbles-crop');
    this.bubbleContainer = this.graph.select('.vzb-bmc-bubbles');
    this.labelListContainer = this.graph.select('.vzb-bmc-bubble-labels');
    this.dataWarningEl = this.graph.select(".vzb-data-warning");

    this.yTitleEl = this.graph.select(".vzb-bmc-axis-y-title");
    this.cTitleEl = this.graph.select(".vzb-bmc-axis-c-title");
    this.yInfoEl = this.graph.select(".vzb-bmc-axis-y-info");
    this.cInfoEl = this.graph.select(".vzb-bmc-axis-c-info");

    this.entityBubbles = null;
    this.tooltip = this.element.select('.vzb-bmc-tooltip');

    // year background
    this.yearEl = this.graph.select('.vzb-bmc-year');
    this.year = new DynamicBackground(this.yearEl);
    this.year.setConditions({ xAlign: 'left', yAlign: 'bottom' });

    var _this = this;
    this.on("resize", function () {
      //return if updatesize exists with error
      if(_this.updateSize()) return;
      _this.updateMarkerSizeLimits();
      _this._labels.updateSize();
      _this.redrawDataPoints();
      //_this._selectlist.redraw();

    });

    this.initMap();

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
  ready: function () {
    var _this = this;
    this.updateUIStrings();
    this.updateIndicators();
    this.updateSize();
    this.updateMarkerSizeLimits();
    this.model.marker.getFrame(this.model.time.value, function(values, time) {
      // TODO: temporary fix for case when after data loading time changed on validation
      if (time.toString() != _this.model.time.value.toString()) {
        utils.defer(function() {
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

  frameChanged: function(frame, time) {
    if (time.toString() != this.model.time.value.toString()) return; // frame is outdated
    if (!frame) return;

    this.values = frame;
    this.updateTime();
    this.updateDoubtOpacity();
    this.redrawDataPoints(null, false);

  },

  updateUIStrings: function () {
      var _this = this;

      this.translator = this.model.locale.getTFunction();
      var conceptPropsS = _this.model.marker.size.getConceptprops();
      var conceptPropsC = _this.model.marker.color.getConceptprops();

      this.strings = {
          title: {
            S: conceptPropsS.name,
            C: conceptPropsC.name
          }
      };

      this.yTitleEl.select("text")
          .text(this.translator("buttons/size") + ": " + this.strings.title.S)
          .on("click", function() {
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
          .on("click", function() {
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
          .on("click", function () {
              _this.parent.findChildByName("gapminder-datawarning").toggle();
          })
          .on("mouseover", function () {
              _this.updateDoubtOpacity(1);
          })
          .on("mouseout", function () {
              _this.updateDoubtOpacity();
          });

      this.yInfoEl
          .html(iconQuestion)
          .select("svg").attr("width", "0px").attr("height", "0px");

      //TODO: move away from UI strings, maybe to ready or ready once
      this.yInfoEl.on("click", function() {
        _this.parent.findChildByName("gapminder-datanotes").pin();
      });
      this.yInfoEl.on("mouseover", function() {
        var rect = this.getBBox();
        var coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
        var toolRect = _this.root.element.getBoundingClientRect();
        var chartRect = _this.element.node().getBoundingClientRect();
        _this.parent.findChildByName("gapminder-datanotes").setHook('size').show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
      });
      this.yInfoEl.on("mouseout", function() {
        _this.parent.findChildByName("gapminder-datanotes").hide();
      });

      this.cInfoEl
          .html(iconQuestion)
          .select("svg").attr("width", "0px").attr("height", "0px");

      //TODO: move away from UI strings, maybe to ready or ready once
      this.cInfoEl.on("click", function() {
        _this.parent.findChildByName("gapminder-datanotes").pin();
      });
      this.cInfoEl.on("mouseover", function() {
        var rect = this.getBBox();
        var coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
        var toolRect = _this.root.element.getBoundingClientRect();
        var chartRect = _this.element.node().getBoundingClientRect();
        _this.parent.findChildByName("gapminder-datanotes").setHook('color').show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
      });
      this.cInfoEl.on("mouseout", function() {
        _this.parent.findChildByName("gapminder-datanotes").hide();
      });
  },

  // show size number on title when hovered on a bubble
  updateTitleNumbers: function() {
      var _this = this;

      var mobile; // if is mobile device and only one bubble is selected, update the ytitle for the bubble
      if (_this.isMobile && _this.model.marker.select && _this.model.marker.select.length === 1) {
        mobile = _this.model.marker.select[0];
      }

      if(_this.hovered || mobile) {
        var conceptPropsS = _this.model.marker.size.getConceptprops();
        var conceptPropsC = _this.model.marker.color.getConceptprops();

        var hovered = _this.hovered || mobile;
        var formatterS = _this.model.marker.size.getTickFormatter();
        var formatterC = _this.model.marker.color.getTickFormatter();

        var unitS = conceptPropsS.unit || "";
        var unitC = conceptPropsC.unit || "";

        var valueS = _this.values.size[hovered[_this.KEY]];
        var valueC = _this.values.color[hovered[_this.KEY]];

        //resolve value for color from the color legend model
        if(_this.model.marker.color.isDiscrete() && valueC) {
          valueC = this.model.marker.color.getColorlegendMarker().label.getItems()[valueC] || "";
        }

        _this.yTitleEl.select("text")
          .text(_this.translator("buttons/size") + ": " + formatterS(valueS) + " " + unitS);

        _this.cTitleEl.select("text")
          .text(_this.translator("buttons/color") + ": " +
            (valueC || valueC===0 ? formatterC(valueC) + " " + unitC : _this.translator("hints/nodata")));

        this.yInfoEl.classed("vzb-hidden", true);
        this.cInfoEl.classed("vzb-hidden", true);
      } else {
        this.yTitleEl.select("text")
            .text(this.translator("buttons/size") + ": " + this.strings.title.S);
        this.cTitleEl.select("text")
            .text(this.translator("buttons/color") + ": " + this.strings.title.C);

        this.yInfoEl.classed("vzb-hidden", false);
        this.cInfoEl.classed("vzb-hidden", false || this.cTitleEl.classed('vzb-hidden'));
      }
  },

  updateDoubtOpacity: function (opacity) {
      if (opacity == null) opacity = this.wScale(+this.time.getUTCFullYear().toString());
      if (this.someSelected) opacity = 1;
      this.dataWarningEl.style("opacity", opacity);
  },

  updateOpacity: function () {
      var _this = this;
      /*
      this.entityBubbles.classed("vzb-selected", function (d) {
          return _this.model.marker.isSelected(d);
      });
      */

      var OPACITY_HIGHLT = 1.0;
      var OPACITY_HIGHLT_DIM = .3;
      var OPACITY_SELECT = this.model.marker.opacityRegular;
      var OPACITY_REGULAR = this.model.marker.opacityRegular;
      var OPACITY_SELECT_DIM = this.model.marker.opacitySelectDim;

      this.entityBubbles.style("opacity", function (d) {

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

      this.entityBubbles.classed("vzb-selected", function (d) {
          return _this.model.marker.isSelected(d);
      });

      var nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < .01;

      // when pointer events need update...
      if (nonSelectedOpacityZero !== this.nonSelectedOpacityZero) {
          this.entityBubbles.style("pointer-events", function (d) {
              return (!_this.someSelected || !nonSelectedOpacityZero || _this.model.marker.isSelected(d)) ?
                  "visible" : "none";
          });
      }

      this.nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < .01;
  },

  /**
   * Changes labels for indicators
   */
  updateIndicators: function () {
    this.sScale = this.model.marker.size.getScale();
    this.cScale = this.model.marker.color.getScale();
  },

  /**
   * Updates entities
   */
  updateEntities: function () {

    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.TIMEDIM;

    var getKeys = function(prefix) {
      prefix = prefix || "";
      return _this.model.marker.getKeys()
        .map(function(d) {
          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer[TIMEDIM] = endTime;
          pointer.sortValue = _this.values.size[d[KEY]]||0;
          pointer[KEY] = prefix + d[KEY];
          return pointer;
        })
        .sort(function(a, b) {
          return b.sortValue - a.sortValue;
        });
    };

    // get array of GEOs, sorted by the size hook
    // that makes larger bubbles go behind the smaller ones
    var endTime = this.model.time.end;
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


    this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bmc-bubble')
      .data(this.model.marker.getVisible(), function(d) { return d[KEY]; })
      .order();

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles = this.entityBubbles.enter().append("circle")
      .attr("class", "vzb-bmc-bubble")
      .on("mouseover", function (d, i) {
          if (utils.isTouchDevice()) return;
          _this._interact()._mouseover(d, i);
      })
      .on("mouseout", function (d, i) {
          if (utils.isTouchDevice()) return;
          _this._interact()._mouseout(d, i);
      })
      .on("click", function (d, i) {
          if (utils.isTouchDevice()) return;
          _this._interact()._click(d, i);
          _this.highlightMarkers();
      })
      .onTap(function (d, i) {
          _this._interact()._click(d, i);
          d3.event.stopPropagation();
      })
      .onLongTap(function (d, i) {
      })
      .merge(this.entityBubbles);

  },

  unselectBubblesWithNoData: function(frame) {
      var _this = this;
      var KEY = this.KEY;
      if(!frame) frame = this.values;

      if(!frame || !frame.size) return;

      this.model.marker.select.forEach(function(d) {
        if(!frame.size[d[KEY]] && frame.size[d[KEY]] !== 0)
            _this.model.marker.selectMarker(d);
      });
  },

  redrawDataPoints: function(duration, reposition) {
    var _this = this;
    if(!duration) duration = this.duration;
    if(!reposition) reposition = true;
    if(!this.entityBubbles) return utils.warn("redrawDataPoints(): no entityBubbles defined. likely a premature call, fix it!");
    this.entityBubbles.each(function(d, index) {
      var view = d3.select(this);
      var geo = d3.select("#" + d[_this.KEY]);

      var valueX = _this.values.hook_lng[d[_this.KEY]];
      var valueY = _this.values.hook_lat[d[_this.KEY]];
      var valueS = _this.values.size[d[_this.KEY]];
      var valueC = _this.values.color[d[_this.KEY]];
      var valueL = _this.values.label[d[_this.KEY]];

      d.hidden_1 = d.hidden;
      d.hidden = (!valueS && valueS !== 0)|| valueX==null || valueY==null;


      if(d.hidden !== d.hidden_1) {
        if(duration) {
            view.transition().duration(duration).ease(d3.easeLinear)
                .style("opacity", 0)
                .on("end", () => view.classed("vzb-hidden", d.hidden).style("opacity", _this.model.marker.opacityRegular));
        } else {
          view.classed("vzb-hidden", d.hidden);
        }
      }
      if(!d.hidden) {

          d.r = utils.areaToRadius(_this.sScale(valueS||0));
          d.label = valueL;

          view.classed("vzb-hidden", false)
              .attr("fill", valueC!=null?_this.cScale(valueC):_this.COLOR_WHITEISH);

          if (_this.model.ui.map.colorGeo)
            geo.style("fill", valueC!=null?_this.cScale(valueC):"#999");

          if(reposition) {
              d.cLoc = _this.skew(_this.projection([valueX||0, valueY||0]));

              view.attr("cx", d.cLoc[0])
                  .attr("cy", d.cLoc[1]);
          }

          if(duration) {
              view.transition().duration(duration).ease(d3.easeLinear)
                  .attr("r", d.r);
          }else{
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
  updateTime: function() {
    var _this = this;

    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;
    this.year.setText(this.model.time.formatDate(this.time), this.duration);

    //possibly update the exact value in size title
    this.updateTitleNumbers();
  },


  fitSizeOfTitles: function() {

    //reset font sizes first to make the measurement consistent
    var yTitleText = this.yTitleEl.select("text")
      .style("font-size", null);
    var cTitleText = this.cTitleEl.select("text")
      .style("font-size", null);

    var yTitleText = this.yTitleEl.select("text");
    var cTitleText = this.cTitleEl.select("text");

    var yTitleBB = yTitleText.node().getBBox();
    var cTitleBB = this.cTitleEl.classed('vzb-hidden') ? yTitleBB : cTitleText.node().getBBox();

    var font =
        Math.max(parseInt(yTitleText.style("font-size")), parseInt(cTitleText.style("font-size")))
        * this.width / Math.max(yTitleBB.width, cTitleBB.width);

    if(Math.max(yTitleBB.width, cTitleBB.width) > this.width) {
      yTitleText.style("font-size", font + "px");
      cTitleText.style("font-size", font + "px");
    } else {

      // Else - reset the font size to default so it won't get stuck
      yTitleText.style("font-size", null);
      cTitleText.style("font-size", null);
    }

  },

  initMap: function() {
    if(!this.topology) utils.warn("bubble map afterPreload: missing country shapes " + this.topology);

    // http://bl.ocks.org/mbostock/d4021aa4dccfd65edffd patterson
    // http://bl.ocks.org/mbostock/3710566 robinson
    // map background

    //stage

    this.projection = d3["geo" + utils.capitalize(this.model.ui.map.projection)]();

    this.mapPath = d3.geoPath()
        .projection(this.projection);

    this.mapGraph = this.element.select(".vzb-bmc-map-graph");
    this.mapGraph.html('');

    this.mapFeature = topojson.feature(this.topology, this.topology.objects[this.model.ui.map.topology.objects.geo]);
    var boundaries = topojson.mesh(this.topology, this.topology.objects[this.model.ui.map.topology.objects.boundaries], function(a, b) { return a !== b; });

    // project to bounding box https://bl.ocks.org/mbostock/4707858
    this.projection
        .scale(1)
        .translate([0, 0]);

    this.mapBounds = this.mapPath.bounds(this.mapFeature);

    if (this.mapFeature.features) {
      this.mapGraph.selectAll(".land")
          .data(this.mapFeature.features)
          .enter().insert("path")
            .attr("d", this.mapPath)
            .attr("id", d => d.properties[this.model.ui.map.topology.geoIdProperty].toLowerCase())
            .attr("class", "land");
    } else {
      this.mapGraph.insert("path")
          .datum(this.mapFeature)
          .attr("class", "land");
    }

    this.mapGraph.insert("path")
        .datum(boundaries)
        .attr("class", "boundary");
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
  updateSize: function () {

    this.activeProfile = this.getActiveProfile(this.profiles, this.presentationProfileChanges);
    var margin = this.activeProfile.margin;

    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if(this.height<=0 || this.width<=0) return utils.warn("Bubble map updateSize() abort: vizabi container is too little or has display:none");

    this.repositionElements();
    this.rescaleMap();

  },

  repositionElements: function() {

    var margin = this.activeProfile.margin,
        infoElHeight = this.activeProfile.infoElHeight,
        isRTL = this.model.locale.isRTL();

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.setConditions({
      widthRatio: 2/10
    });
    this.year.resize(this.width, this.height);

    this.yTitleEl
        .style("font-size", infoElHeight)
        .attr("transform", "translate(" + (isRTL ? this.width : 0) + "," + margin.top + ")");

    var yTitleBB = this.yTitleEl.select("text").node().getBBox();

    //hide the second line about color in large profile or when color is constant
    this.cTitleEl.attr("transform", "translate(" + (isRTL ? this.width : 0) + "," + (margin.top + yTitleBB.height) + ")")
        .classed("vzb-hidden", this.getLayoutProfile()==="large" || this.model.marker.color.use == "constant");

    var warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
        .attr("width", warnBB.height * 0.75)
        .attr("height", warnBB.height * 0.75)
        .attr("x", -warnBB.width - warnBB.height * 1.2)
        .attr("y", -warnBB.height * 0.65);

    this.dataWarningEl
        .attr("transform", "translate(" + (this.width) + "," + (this.height - warnBB.height * 0.5) + ")")
        .select("text");

    if(this.yInfoEl.select('svg').node()) {
        var titleBBox = this.yTitleEl.node().getBBox();
        var t = utils.transform(this.yTitleEl.node());
        var hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * .4);

        this.yInfoEl.select('svg')
            .attr("width", infoElHeight)
            .attr("height", infoElHeight);
        this.yInfoEl.attr('transform', 'translate('
            + hTranslate + ','
            + (t.translateY - infoElHeight * 0.8) + ')');
    }

    this.cInfoEl.classed("vzb-hidden", this.cTitleEl.classed("vzb-hidden"));

    if(!this.cInfoEl.classed("vzb-hidden") && this.cInfoEl.select('svg').node()) {
        var titleBBox = this.cTitleEl.node().getBBox();
        var t = utils.transform(this.cTitleEl.node());
        var hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * .4);

        this.cInfoEl.select('svg')
            .attr("width", infoElHeight)
            .attr("height", infoElHeight);
        this.cInfoEl.attr('transform', 'translate('
            + hTranslate + ','
            + (t.translateY - infoElHeight * 0.8) + ')');
    }
  },

  rescaleMap: function() {

    var offset = this.model.ui.map.offset;
    var margin = this.activeProfile.margin;

    // scale to aspect ratio
    // http://bl.ocks.org/mbostock/4707858
    var s = this.model.ui.map.scale / Math.max((this.mapBounds[1][0] - this.mapBounds[0][0]) / this.width, (this.mapBounds[1][1] - this.mapBounds[0][1]) / this.height),

        // dimensions of the map itself (regardless of cropping)
        mapWidth = (s * (this.mapBounds[1][0] - this.mapBounds[0][0])),
        mapHeight = (s * (this.mapBounds[1][1] - this.mapBounds[0][1])),

        // dimensions of the viewport in which the map is shown (can be bigger or smaller than map)
        viewPortHeight = mapHeight * (1 + offset.top + offset.bottom),
        viewPortWidth  = mapWidth  * (1 + offset.left + offset.right),
        mapTopOffset   = mapHeight * offset.top,
        mapLeftOffset  = mapWidth  * offset.left,

        // translate projection to the middle of map
        t = [(mapWidth - s * (this.mapBounds[1][0] + this.mapBounds[0][0])) / 2, (mapHeight - s * (this.mapBounds[1][1] + this.mapBounds[0][1])) / 2];

    this.projection
      .scale(s)
      .translate(t);

    this.mapGraph
      .selectAll('path').attr("d", this.mapPath);

    // handle scale to fit case
    var widthScale, heightScale;
    if (!this.model.ui.map.preserveAspectRatio) {

      // wrap viewBox around viewport so map scales to fit viewport
      var viewBoxHeight = viewPortHeight;
      var viewBoxWidth = viewPortWidth;

      // viewport is complete area (apart from scaling)
      viewPortHeight = this.height * this.model.ui.map.scale;
      viewPortWidth = this.width * this.model.ui.map.scale;

      this.mapSvg
        .attr('preserveAspectRatio', 'none')
        .attr('viewBox', [0, 0, viewBoxWidth, viewBoxHeight].join(' '));

      //            ratio between map, viewport and offset (for bubbles)
      widthScale  = viewPortWidth  / mapWidth  / (1 + offset.left + offset.right);
      heightScale = viewPortHeight / mapHeight / (1 + offset.top  + offset.bottom);

    } else {

      // no scaling needed
      widthScale = 1;
      heightScale = 1;

    }

    // internal offset against parent container (mapSvg)
    this.mapGraph
      .attr('transform', 'translate(' + mapLeftOffset + ',' + mapTopOffset + ')');

    // resize and put in center
    this.mapSvg
      .style("transform", "translate3d(" + (margin.left + (this.width-viewPortWidth)/2) + "px," + (margin.top + (this.height-viewPortHeight)/2) + "px,0)")
      .attr('width', viewPortWidth)
      .attr('height', viewPortHeight);

    // set skew function used for bubbles in chart
    var _this = this;
    this.skew = (function () {
      var w = _this.width;
      var h = _this.height;
      //input pixel loc after projection, return pixel loc after skew;
      return function (points) {
        //      input       scale         translate                    translate offset
        var x = points[0] * widthScale  + ((w - viewPortWidth) / 2)  + mapLeftOffset * widthScale;
        var y = points[1] * heightScale + ((h - viewPortHeight) / 2) + mapTopOffset  * heightScale;
        return [x, y];
      };
    }());


  },

  updateMarkerSizeLimits: function() {
    var _this = this;
    var extent = this.model.marker.size.extent || [0,1];

    var minRadius = this.activeProfile.minRadius;
    var maxRadius = this.activeProfile.maxRadius;

    this.minRadius = Math.max(maxRadius * extent[0], minRadius);
    this.maxRadius = Math.max(maxRadius * extent[1], minRadius);

    if(this.model.marker.size.scaleType !== "ordinal") {
      this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
    } else {
      this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
    }

  },

  _interact: function () {
      var _this = this;

      return {
          _mouseover: function (d, i) {
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
          _mouseout: function (d, i) {
              if (_this.model.time.dragging) return;
              _this._setTooltip();
              _this.hovered = null;
              _this.updateTitleNumbers();
              _this.fitSizeOfTitles();
              _this.model.marker.clearHighlighted();
          },
          _click: function (d, i) {
              _this.model.marker.selectMarker(d);
          }
      };

  },


  highlightMarkers: function () {
      var _this = this;
      this.someHighlighted = (this.model.marker.highlight.length > 0);

      if(utils.isTouchDevice()) {
        if(this.someHighlighted) {
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

  _updateLabel: function(d, index, valueX, valueY, valueS, valueC, valueL, duration) {
    var _this = this;
    var KEY = this.KEY;
    if(d[KEY] == _this.druging) return;
    if(duration == null) duration = _this.duration;

    // only for selected entities
    if(_this.model.marker.isSelected(d)) {

      var showhide = d.hidden !== d.hidden_1;
      var valueLST = null;
      var cache = {};
      cache.labelX0 = valueX / this.width;
      cache.labelY0 = valueY / this.height;
      cache.scaledS0 = valueS ? utils.areaToRadius(_this.sScale(valueS)) : null;
      cache.scaledC0 = valueC!=null?_this.cScale(valueC):_this.COLOR_WHITEISH;

      this._labels.updateLabel(d, index, cache, valueX / this.width, valueY / this.height, valueS, valueC, valueL, valueLST, duration, showhide);
    }
  },

  selectMarkers: function () {
      var _this = this;
      var KEY = this.KEY;
      this.someSelected = (this.model.marker.select.length > 0);

//      this._selectlist.rebuild();
      if(utils.isTouchDevice()) {
        _this._labels.showCloseCross(null, false);
        if(_this.someHighlighted) {
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

  _setTooltip: function (d) {
    var _this = this;
    if (d) {
      var tooltipText = d.label;
      var x = d.cLoc[0];
      var y = d.cLoc[1];
      var offset = d.r;
      var mouse = d3.mouse(this.graph.node()).map(function(d) {
        return parseInt(d);
      });
      var xPos, yPos, xSign = -1,
        ySign = -1,
        xOffset = 0,
        yOffset = 0;

      if(offset) {
        xOffset = offset * .71; // .71 - sin and cos for 315
        yOffset = offset * .71;
      }
      //position tooltip
      this.tooltip.classed("vzb-hidden", false)
        //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
        .selectAll("text")
        .text(tooltipText);

      var contentBBox = this.tooltip.select('text').node().getBBox();
      if(x - xOffset - contentBBox.width < 0) {
        xSign = 1;
        x += contentBBox.width + 5; // corrective to the block Radius and text padding
      } else {
        x -= 5; // corrective to the block Radius and text padding
      }
      if(y - yOffset - contentBBox.height < 0) {
        ySign = 1;
        y += contentBBox.height;
      } else {
        y -= 11; // corrective to the block Radius and text padding
      }
      if(offset) {
        xPos = x + xOffset * xSign;
        yPos = y + yOffset * ySign; // 5 and 11 - corrective to the block Radius and text padding
      } else {
        xPos = x + xOffset * xSign; // .71 - sin and cos for 315
        yPos = y + yOffset * ySign; // 5 and 11 - corrective to the block Radius and text padding
      }
      this.tooltip.attr("transform", "translate(" + (xPos ? xPos : mouse[0]) + "," + (yPos ? yPos : mouse[1]) +
        ")");

      this.tooltip.select('rect').attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * .85)
        .attr("rx", contentBBox.height * .2)
        .attr("ry", contentBBox.height * .2);


    } else {

      this.tooltip.classed("vzb-hidden", true);
    }
  },

  preload: function() {
    var _this = this;

    var shape_path = this.model.ui.map.topology.path
      || globals.ext_resources.host + globals.ext_resources.preloadPath + "world-50m.json";

    return new Promise(function(resolve, reject) {
      d3.json(shape_path, function(error, json) {
        if(error) return console.warn("Failed loading json " + shape_path + ". " + error);
        _this.topology = json;
        resolve();
      });
    });
  }

});


export default BubbleMapComponent;
