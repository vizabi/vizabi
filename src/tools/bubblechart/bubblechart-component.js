import * as utils from "base/utils";
import Component from "base/component";
import Trail from "tools/bubblechart/bubblechart-trail";
import PanZoom from "tools/bubblechart/bubblechart-panzoom";
import Exporter from "helpers/svgexport";
import Labels from "helpers/labels";
import axisSmart from "helpers/d3.axisWithLabelPicker";
import DynamicBackground from "helpers/d3.dynamicBackground";

import {
  warn as iconWarn,
  question as iconQuestion
} from "base/iconset";


//BUBBLE CHART COMPONENT
const BubbleChartComp = Component.extend({

  /**
   * Initializes the component (Bubble Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init(config, context) {
    const _this = this;
    this.name = "bubblechart";
    this.template = require("./bubblechart.html");

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

    this.model_binds = {
      "change:time.playing": function(evt, original) {
        if (utils.isTouchDevice() && _this.model.time.playing && _this.someHighlighted) {
          _this.model.marker.clearHighlighted();
        }
      },
      "change:time.start": function(evt, original) {
        if (_this.model.marker.color.scaleType === "time") {
          _this.model.marker.color.scale = null;
        }
        if (!_this._readyOnce || _this.model.time.splash) return;
        _this._trails.create().then(() => {
          _this._trails.run(["findVisible", "reveal", "opacityHandler"]);
        });
      },
      "change:time.end": function(evt, original) {
        if (!_this._readyOnce || _this.model.time.splash) return;
        _this._trails.create().then(() => {
          _this._trails.run(["findVisible", "reveal", "opacityHandler"]);
        });
      },
      "change:time.record": function() {
        //console.log("change time record");
        if (_this.model.time.record) {
          _this._export.open(this.element, this.name);
        } else {
          _this._export.reset();
        }
      },
      "change:ui.chart.trails": function(evt) {
        //console.log("EVENT change:time:trails");
        _this._trails.toggle(_this.model.ui.chart.trails);
        _this.redrawDataPoints();
      },
      "change:ui.chart.lockNonSelected": function(evt) {
        //console.log("EVENT change:time:lockNonSelected");
        _this.redrawDataPoints(500);
      },
      "change:marker": function(evt, path) {
        // bubble size change is processed separately
        if (!_this._readyOnce) return;
        if (path.indexOf("scaleType") > -1) {
          _this.ready();
          return;
        }

        if (path.indexOf("marker.color") !== -1) return;
        if (path.indexOf("marker.size") !== -1) return;
        if (path.indexOf("marker.size_label") !== -1) return;

        if (path.indexOf("domainMin") > -1 || path.indexOf("domainMax") > -1) {
          if (!_this.yScale || !_this.xScale) return; //abort if building of the scale is in progress
          _this.updateSize();
          _this.updateMarkerSizeLimits();
          _this._trails.run("findVisible");
          _this.redrawDataPoints();
          _this._trails.run("resize", null, 500);
        } else if (path.indexOf("zoomedMin") > -1 || path.indexOf("zoomedMax") > -1) {
          if (_this.draggingNow) return;

          //avoid zooming again if values didn't change.
          //also prevents infinite loop on forced URL update from zoom.stop()
          if (utils.approxEqual(_this._zoomedXYMinMax.axis_x.zoomedMin, _this.model.marker.axis_x.zoomedMin, 0.01)
          && utils.approxEqual(_this._zoomedXYMinMax.axis_x.zoomedMax, _this.model.marker.axis_x.zoomedMax, 0.01)
          && utils.approxEqual(_this._zoomedXYMinMax.axis_y.zoomedMin, _this.model.marker.axis_y.zoomedMin, 0.01)
          && utils.approxEqual(_this._zoomedXYMinMax.axis_y.zoomedMax, _this.model.marker.axis_y.zoomedMax, 0.01)
          ) return;
          let playAfterZoom = false;
          if (_this.model.time.playing) {
            playAfterZoom = true;
            _this.model.time.pause(true);
          }
          _this._trails.run("abortAnimation");
          _this._panZoom.zoomToMaxMin(
            _this.model.marker.axis_x.zoomedMin,
            _this.model.marker.axis_x.zoomedMax,
            _this.model.marker.axis_y.zoomedMin,
            _this.model.marker.axis_y.zoomedMax,
            500 /*duration*/, "don't feed these zoom values back to state"
          );
          if (playAfterZoom) {
            _this.model.time.postponePause = false;
          }
        }

        //console.log("EVENT change:marker", evt);
      },
      "change:marker.select": function(evt, path) {
        if (!_this._readyOnce || !_this.entityBubbles) return;
        //console.log("EVENT change:entities:select");

        //disable trails if too many items get selected at once
        //otherwise it's too much waiting time
        if ((evt.source._val || []).length - (evt.source._previousVal || []).length > 50) _this.model.ui.chart.trails = false;

        _this.selectDataPoints();
        _this.redrawDataPoints();
        _this._trails.create().then(() => {
          _this._trails.run(["findVisible", "reveal", "opacityHandler"]);
        });
        _this.updateBubbleOpacity();
        _this._updateDoubtOpacity();
      },
      "change:marker.highlight": function(evt, path) {
        if (!_this._readyOnce) return;
        //path have values if trail is highlighted
        if (path != "highlight") {
          if (path !== null) {
            const titles = _this._formatSTitleValues(path.size, path.color);
            _this._updateSTitle(titles[0], titles[1]);
          } else {
            _this._updateSTitle();
          }
          return;
        }
        //console.log("EVENT change:entities:highlight");
        _this.highlightDataPoints();
      },
      "change:time.value": function() {
        if (!_this._readyOnce || !_this.entityBubbles) return;
        if (!_this.calculationQueue) { // collect timestamp that we request
          _this.calculationQueue = [_this.model.time.value.toString()];
        } else {
          _this.calculationQueue.push(_this.model.time.value.toString());
        }
        (function(time) { // isolate timestamp
        //_this._bubblesInteract().mouseout();
          _this.model.marker.getFrame(time, (frame, time) => {
            if (!_this._frameIsValid(frame)) return utils.warn("change:time.value: empty data received from marker.getFrame(). doing nothing");
            const index = _this.calculationQueue.indexOf(time.toString()); //
            if (index == -1) { // we was receive more recent frame before so we pass this frame
              return;
            }
            _this.calculationQueue.splice(0, index + 1); // remove timestamps that added to queue before current timestamp
            _this.frameChanged(frame, time);
          });

        })(_this.model.time.value);
      },
      "change:ui.adaptMinMaxZoom": function() {
        //console.log("EVENT change:ui:adaptMinMaxZoom");
        if (_this.model.ui.adaptMinMaxZoom) {
          _this._panZoom.expandCanvas(500);
        } else {
          _this._panZoom.reset();
        }
      },
      "change:marker.size.extent": function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if (!_this._readyOnce) return;
        _this.updateMarkerSizeLimits();
        _this.redrawDataPointsOnlySize();
        _this._trails.run("resize");
      },
      "change:marker.color": function(evt, path) {
        if (!_this._readyOnce) return;
        //console.log("EVENT change:marker:color:palette");
        _this.redrawDataPointsOnlyColors();
        _this._trails.run("recolor");
      },
      // 'change:marker.color.palette': function(evt, path) {
      //   if(!_this._readyOnce) return;
      //   //console.log("EVENT change:marker:color:palette");
      //   _this.redrawDataPointsOnlyColors();
      //   _this._trails.run("recolor");
      // },
      "change:marker.opacitySelectDim": function() {
        _this.updateBubbleOpacity();
      },
      "change:marker.opacityRegular": function() {
        _this.updateBubbleOpacity();
        _this._trails.run("opacityHandler");
      },
      "change:ui.cursorMode": function() {
        const svg = _this.chartSvg;
        if (_this.model.ui.cursorMode === "plus") {
          svg.classed("vzb-zoomin", true);
          svg.classed("vzb-zoomout", false);
          svg.classed("vzb-panhand", false);
        } else if (_this.model.ui.cursorMode === "minus") {
          svg.classed("vzb-zoomin", false);
          svg.classed("vzb-zoomout", true);
          svg.classed("vzb-panhand", false);
        } else if (_this.model.ui.cursorMode === "hand") {
          svg.classed("vzb-zoomin", false);
          svg.classed("vzb-zoomout", false);
          svg.classed("vzb-panhand", true);
        } else {
          svg.classed("vzb-zoomin", false);
          svg.classed("vzb-zoomout", false);
          svg.classed("vzb-panhand", false);
        }
      },
      "ready": function() {
        // if(_this.model.marker.color.scaleType === 'time') {
        //   _this.model.marker.color.scale = null;
        //   utils.defer(function() {
        //     _this.trigger('ready');
        //   });
        // }
      }
    };

    this._super(config, context);

    this.xScale = null;
    this.yScale = null;
    this.sScale = null;
    this.cScale = null;

    this.xAxis = axisSmart("bottom");
    this.yAxis = axisSmart("left");

    _this.COLOR_BLACKISH = "#333";
    _this.COLOR_WHITEISH = "#fdfdfd";

    this.isCanvasPreviouslyExpanded = false;
    this.draggingNow = null;

    this._trails = new Trail(this);
    this._panZoom = new PanZoom(this);
    this._export = new Exporter(this);
    this._export
      .prefix("vzb-bc-")
      .deleteClasses(["vzb-bc-bubbles-crop", "vzb-hidden", "vzb-bc-year", "vzb-bc-zoom-rect",
        "vzb-bc-projection-x", "vzb-bc-projection-y", "vzb-bc-axis-c-title"
      ]);
    this._labels = new Labels(this);
    this._labels.config({
      CSS_PREFIX: "vzb-bc",
      LABELS_CONTAINER_CLASS: "vzb-bc-labels",
      LINES_CONTAINER_CLASS: "vzb-bc-bubbles",
      LINES_CONTAINER_SELECTOR_PREFIX: "bubble-"
    });
  },

  _rangeBump(arg, undo) {
    const bump = this.activeProfile.maxRadius / 2;
    undo = undo ? -1 : 1;
    if (utils.isArray(arg) && arg.length > 1) {
      let z1 = arg[0];
      let z2 = arg[arg.length - 1];

      //the sign of bump depends on the direction of the scale
      if (z1 < z2) {
        z1 += bump * undo;
        z2 -= bump * undo;
        // if the scale gets inverted because of bump, set it to avg between z1 and z2
        if (z1 > z2) z1 = z2 = (z1 + z2) / 2;
      } else if (z1 > z2) {
        z1 -= bump * undo;
        z2 += bump * undo;
        // if the scale gets inverted because of bump, set it to avg between z1 and z2
        if (z1 < z2) z1 = z2 = (z1 + z2) / 2;
      } else {
        utils.warn("rangeBump error: the input scale range has 0 length. that sucks");
      }
      return [z1, z2];
    }
    utils.warn("rangeBump error: input is not an array or empty");
  },

//  _marginUnBump: function(arg) {
//    var bump = this.profiles[this.getLayoutProfile()].maxRadius/2;
//    if(utils.isObject(arg)) {
//      return {
//        left: arg.left - bump,
//        right: arg.right - bump,
//        top: arg.top - bump,
//        bottom: arg.bottom - bump
//      };
//    } else {
//      utils.warn("marginUnBump error: input is not an object {left top bottom right}");
//    }
//  },


  /**
   * Executes right after the template is in place, but the model is not yet ready
   */
  readyOnce() {
    const _this = this;
    this._readyOnce = false;
    this.scrollableAncestor = utils.findScrollableAncestor(this.element);
    this.element = d3.select(this.element);

    // reference elements
    this.chartSvg = this.element.select("svg");
    this.graph = this.element.select(".vzb-bc-graph");
    this.yAxisElContainer = this.graph.select(".vzb-bc-axis-y");
    this.yAxisEl = this.yAxisElContainer.select("g");

    this.xAxisElContainer = this.graph.select(".vzb-bc-axis-x");
    this.xAxisEl = this.xAxisElContainer.select("g");

    this.yTitleEl = this.graph.select(".vzb-bc-axis-y-title");
    this.xTitleEl = this.graph.select(".vzb-bc-axis-x-title");
    this.sTitleEl = this.graph.select(".vzb-bc-axis-s-title");
    this.cTitleEl = this.graph.select(".vzb-bc-axis-c-title");
    this.yearEl = this.graph.select(".vzb-bc-year");

    this.year = new DynamicBackground(this.yearEl);

    this.yInfoEl = this.graph.select(".vzb-bc-axis-y-info");
    this.xInfoEl = this.graph.select(".vzb-bc-axis-x-info");
    this.dataWarningEl = this.graph.select(".vzb-data-warning");

    this.projectionX = this.graph.select(".vzb-bc-projection-x");
    this.projectionY = this.graph.select(".vzb-bc-projection-y");
    this.lineEqualXY = this.graph.select(".vzb-bc-line-equal-xy");

    this.trailsContainer = this.graph.select(".vzb-bc-trails");
    this.bubbleContainerCrop = this.graph.select(".vzb-bc-bubbles-crop");
    this.zoomSelection = this.graph.select(".vzb-zoom-selection");
    this.labelsContainerCrop = this.graph.select(".vzb-bc-labels-crop");
    this.bubbleContainer = this.graph.select(".vzb-bc-bubbles");
    this.labelsContainer = this.graph.select(".vzb-bc-labels");
    this.linesContainer = this.graph.select(".vzb-bc-lines");
    this.zoomRect = this.element.select(".vzb-bc-zoom-rect");
    this.eventArea = this.element.select(".vzb-bc-eventarea");

    this.entityBubbles = null;
    this.bubbleCrown = this.element.select(".vzb-bc-bubble-crown");
    //set filter
    this.bubbleCrown.selectAll(".vzb-crown-glow")
      .attr("filter", "url(" + location.pathname + "#vzb-glow-filter)");
    this.tooltip = this.element.select(".vzb-bc-tooltip");
    //set filter
    this.tooltip.select(".vzb-tooltip-glow")
      .attr("filter", "url(" + location.pathname + "#vzb-glow-filter)");

    this.tooltipMobile = this.element.select(".vzb-tooltip-mobile");
    //component events
    this.on("resize", () => {
      //console.log("EVENT: resize");
      //return if updatesize exists with error
      _this._trails.run("abortAnimation");
      if (_this.updateSize()) return;
      _this.updateMarkerSizeLimits();
      _this._labels.updateSize();
      (function(xMin, xMax, yMin, yMax) {
        _this._panZoom.zoomer.dontFeedToState = true;
        _this._panZoom.rerun(); // includes redraw data points and trail resize
        _this._panZoom.zoomToMaxMin(xMin, xMax, yMin, yMax, 0, true);
      })(_this._zoomedXYMinMax.axis_x.zoomedMin,
        _this._zoomedXYMinMax.axis_x.zoomedMax,
        _this._zoomedXYMinMax.axis_y.zoomedMin,
        _this._zoomedXYMinMax.axis_y.zoomedMax);
    });

    //keyboard listeners
    d3.select("body")
      .on("keydown", () => {
        if (_this.model.ui.cursorMode !== "arrow" && _this.model.ui.cursorMode !== "hand") return;
        if (d3.event.metaKey || d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", true);
      })
      .on("keyup", () => {
        if (_this.model.ui.cursorMode !== "arrow" && _this.model.ui.cursorMode !== "hand") return;
        if (!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
      })
      //this is for the case when user would press ctrl and move away from the browser tab or window
      //keyup event would happen somewhere else and won't be captured, so zoomin class would get stuck
      .on("mouseenter", () => {
        if (_this.model.ui.cursorMode !== "arrow" && _this.model.ui.cursorMode !== "hand") return;
        if (!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
      });

    this.root.on("resetZoom", () => {
      _this._panZoom.reset(null, 500);
    });

    this._panZoom.zoomSelection(this.bubbleContainerCrop);
    this.bubbleContainerCrop
      .call(this._panZoom.dragRectangle)
      .call(this._panZoom.zoomer)
      .on("dblclick.zoom", null)
      .on("mouseup", () => {
        _this.draggingNow = false;
      })
      .on("click", () => {
        const cursor = _this.model.ui.cursorMode;
        if (!d3.event.defaultPrevented && cursor !== "arrow" && cursor !== "hand") {
          _this._panZoom.zoomByIncrement(cursor, 500);
        }
      });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.updateUIStrings();

    this.wScale = d3.scale.linear()
      .domain(this.model.ui.datawarning.doubtDomain)
      .range(this.model.ui.datawarning.doubtRange);

    this._labels.readyOnce();

    _this._readyOnce = true;
  },

  _frameIsValid(frame) {
    return !(!frame
    || Object.keys(frame.axis_y).length === 0
    || Object.keys(frame.axis_x).length === 0
    || Object.keys(frame.size).length === 0);
  },

  ready() {
    const _this = this;
    this.updateUIStrings();
    const endTime = this.model.time.end;
    this.updateIndicators();
    this.updateTime();
    if (!_this.model.time.splash) {
      _this._trails.create();
    }
    this.model.marker.getFrame(this.model.time.value, (frame, time) => {
      // TODO: temporary fix for case when after data loading time changed on validation
      if (time.toString() != _this.model.time.value.toString()) {
        utils.defer(() => {
          _this.ready();
        });
        return;
      }
      if (!_this._frameIsValid(frame)) return utils.warn("ready: empty data received from marker.getFrame(). doing nothing");

      _this.frame = frame;
      _this.updateSize();
      _this.updateMarkerSizeLimits();
      _this.updateEntities();
      _this._labels.ready();
      _this.redrawDataPoints();
      _this.selectDataPoints();
      _this.updateBubbleOpacity();
      _this._updateDoubtOpacity();
      _this.zoomToMarkerMaxMin(); // includes redraw data points and trail resize
      if (!_this.model.time.splash) {
        _this._trails.run(["findVisible", "reveal", "opacityHandler"]);
      }
      if (_this.model.ui.adaptMinMaxZoom) _this._panZoom.expandCanvas();
    });
  },

    /*
     * Zoom to the min and max values given in the URL axes markers.
     */
  zoomToMarkerMaxMin() {
        /*
         * Reset just the zoom values without triggering a zoom event. This ensures
         * a clean zoom state for the subsequent zoom event.
         */
    this._panZoom.resetZoomState();

    const xAxis = this.model.marker.axis_x;
    const yAxis = this.model.marker.axis_y;

    const xDomain = xAxis.getScale().domain();
    const yDomain = yAxis.getScale().domain();

        /*
         * The axes may return null when there is no value given for the zoomed
         * min and max values. In that case, fall back to the axes' domain values.
         */
    const zoomedMinX = xAxis.zoomedMin ? xAxis.zoomedMin : xDomain[0];
    const zoomedMaxX = xAxis.zoomedMax ? xAxis.zoomedMax : xDomain[1];
    const zoomedMinY = yAxis.zoomedMin ? yAxis.zoomedMin : yDomain[0];
    const zoomedMaxY = yAxis.zoomedMax ? yAxis.zoomedMax : yDomain[1];

        //by default this will apply no transition and feed values back to state
    this._panZoom.zoomToMaxMin(zoomedMinX, zoomedMaxX, zoomedMinY, zoomedMaxY, 0, "don't feed these zoom values back to state");
  },

  /*
   * UPDATE INDICATORS
   */
  updateIndicators() {
    const _this = this;

    //scales
    this.yScale = this.model.marker.axis_y.getScale();
    this.xScale = this.model.marker.axis_x.getScale();
    this.sScale = this.model.marker.size.getScale();
    this.cScale = this.model.marker.color.getScale();
    this._labels.setScales(this.xScale, this.yScale);

    this.yAxis.tickFormat(_this.model.marker.axis_y.getTickFormatter());
    this.xAxis.tickFormat(_this.model.marker.axis_x.getTickFormatter());
  },

  frameChanged(frame, time) {
//    if (time.toString() != this.model.time.value.toString()) return; // frame is outdated
    this.frame = frame;
    this.updateTime();

    this._updateDoubtOpacity();
    this._trails.run("findVisible");
    if (this.model.ui.adaptMinMaxZoom) {
      this._panZoom.expandCanvas();
    } else {
      this.redrawDataPoints();
    }
    this._trails.run("reveal", null, this.duration);
    this.tooltipMobile.classed("vzb-hidden", true);
    this._reorderEntities();
  },

  updateUIStrings() {
    const _this = this;

    const conceptPropsY = _this.model.marker.axis_y.getConceptprops();
    const conceptPropsX = _this.model.marker.axis_x.getConceptprops();
    const conceptPropsS = _this.model.marker.size.getConceptprops();
    const conceptPropsC = _this.model.marker.color.getConceptprops();
    this.translator = this.model.locale.getTFunction();

    this.strings = {
      title: {
        Y: conceptPropsY.name,
        X: conceptPropsX.name,
        S: conceptPropsS.name,
        C: conceptPropsC.name
      },
      unit: {
        Y: conceptPropsY.unit || "",
        X: conceptPropsX.unit || "",
        S: conceptPropsS.unit || "",
        C: conceptPropsC.unit || ""
      }
    };

    const yTitle = this.yTitleEl.selectAll("text").data([0]);
    yTitle.enter().append("text");
    yTitle
      //.attr("y", "-6px")
      .on("click", () => {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_y")
          .alignX(_this.model.locale.isRTL() ? "right" : "left")
          .alignY("top")
          .updateView()
          .toggle();
      });

    const xTitle = this.xTitleEl.selectAll("text").data([0]);
    xTitle.enter().append("text");
    xTitle
      .on("click", () => {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_x")
          .alignX(_this.model.locale.isRTL() ? "right" : "left")
          .alignY("bottom")
          .updateView()
          .toggle();
      });

    const sTitle = this.sTitleEl.selectAll("text").data([0]);
    sTitle.enter().append("text");
    sTitle
      .attr("text-anchor", "end");

    utils.setIcon(this.dataWarningEl, iconWarn).select("svg").attr("width", "0px").attr("height", "0px");
    this.dataWarningEl.append("text")
      .attr("text-anchor", "end")
      .text(this.translator("hints/dataWarning"));

    utils.setIcon(this.yInfoEl, iconQuestion)
      .select("svg").attr("width", "0px").attr("height", "0px");

    utils.setIcon(this.xInfoEl, iconQuestion)
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
      _this.parent.findChildByName("gapminder-datanotes").setHook("axis_y").show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
    });
    this.yInfoEl.on("mouseout", () => {
      _this.parent.findChildByName("gapminder-datanotes").hide();
    });
    this.xInfoEl.on("click", () => {
      _this.parent.findChildByName("gapminder-datanotes").pin();
    });
    this.xInfoEl.on("mouseover", function() {
      if (_this.model.time.dragging) return;
      const rect = this.getBBox();
      const coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      const toolRect = _this.root.element.getBoundingClientRect();
      const chartRect = _this.element.node().getBoundingClientRect();
      _this.parent.findChildByName("gapminder-datanotes").setHook("axis_x").show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
    });
    this.xInfoEl.on("mouseout", () => {
      if (_this.model.time.dragging) return;
      _this.parent.findChildByName("gapminder-datanotes").hide();
    });
    this.dataWarningEl
      .on("click", () => {
        _this.parent.findChildByName("gapminder-datawarning").toggle();
      })
      .on("mouseover", () => {
        _this._updateDoubtOpacity(1);
      })
      .on("mouseout", () => {
        _this._updateDoubtOpacity();
      });
  },

  _updateDoubtOpacity(opacity) {
    if (opacity == null) opacity = this.wScale(+this.model.time.formatDate(this.time));
    if (this.someSelected) opacity = 1;
    this.dataWarningEl.style("opacity", opacity);
  },

  /*
   * UPDATE ENTITIES:
   * Ideally should only update when show parameters change or data changes
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
          pointer.sortValue = _this.frame.size[d[KEY]] || 0;
          pointer[KEY] = prefix + d[KEY];
          return pointer;
        })
        .sort((a, b) => b.sortValue - a.sortValue);
    };

    // get array of GEOs, sorted by the size hook
    // that makes larger bubbles go behind the smaller ones
    const endTime = this.model.time.end;
    const markers = getKeys.call(this);
    this.model.marker.setVisible(markers);

    //unselecting bubbles with no data is used for the scenario when
    //some bubbles are selected and user would switch indicator.
    //bubbles would disappear but selection would stay
    if (!this.model.time.splash) {
      this.unselectBubblesWithNoData(markers);
    }
    this.entityBubbles = this.bubbleContainer.selectAll("circle.vzb-bc-entity")
      .data(this.model.marker.getVisible(), d => d[KEY]); // trails have not keys

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles = this.entityBubbles.enter().append("circle")
      .attr("class", d => "vzb-bc-entity " + "bubble-" + d[KEY])
      .on("mouseover", (d, i) => {
        if (utils.isTouchDevice() || (_this.model.ui.cursorMode !== "arrow" && _this.model.ui.cursorMode !== "hand")) return;
        _this._bubblesInteract().mouseover(d, i);
      })
      .on("mouseout", (d, i) => {
        if (utils.isTouchDevice() || (_this.model.ui.cursorMode !== "arrow" && _this.model.ui.cursorMode !== "hand")) return;

        _this._bubblesInteract().mouseout(d, i);
      })
      .on("click", (d, i) => {
        if (utils.isTouchDevice() || (_this.model.ui.cursorMode !== "arrow" && _this.model.ui.cursorMode !== "hand")) return;

        _this._bubblesInteract().click(d, i);
      })
      .onTap((d, i) => {
        d3.event.stopPropagation();
        _this._bubblesInteract().click(d, i);
      })
      .onLongTap((d, i) => {})
      .merge(this.entityBubbles);

    this._reorderEntities();
  },

  unselectBubblesWithNoData(entities) {
    const _this = this;
    const KEY = this.KEY;
    if (!this.model.marker.select.length) return;

    const _select = [];
    const keys = entities.map(d => d[KEY]);

    this.model.marker.select.forEach(d => {
      if (keys.indexOf(d[KEY]) !== -1) _select.push(d);
    });

    if (_select.length !== _this.model.marker.select.length) _this.model.marker.select = _select;
  },

  _reorderEntities() {
    const _this = this;
    const KEY = this.KEY;
    this.bubbleContainer.selectAll(".vzb-bc-entity")
      .sort((a, b) => {
        const sizeA = _this.frame.size[a[KEY]];
        const sizeB = _this.frame.size[b[KEY]];

        if (typeof sizeA == "undefined" && typeof sizeB != "undefined") return -1;
        if (typeof sizeA != "undefined" && typeof sizeB == "undefined") return 1;
        if (sizeA != sizeB) return d3.descending(sizeA, sizeB);
        if (a[KEY] != b[KEY]) return d3.ascending(a[KEY], b[KEY]);
        if (typeof a.trailStartTime != "undefined" || typeof b.trailStartTime != "undefined") return typeof a.trailStartTime != "undefined" ? -1 : 1; // only lines has trailStartTime
        if (typeof a.limits != "undefined" || typeof b.limits != "undefined") return typeof a.limits != "undefined" ? -1 : 1; // only trails has attribute limits
        return d3.descending(sizeA, sizeB);
      });
  },

  _bubblesInteract() {
    const _this = this;
    const KEY = this.KEY;
    const TIMEDIM = this.TIMEDIM;

    return {
      mouseover(d, i) {
        _this.model.marker.highlightMarker(d);

        _this._labels.showCloseCross(d, true);
      },

      mouseout(d, i) {
        _this.model.marker.clearHighlighted();

        _this._labels.showCloseCross(d, false);
      },

      click(d, i) {
        if (_this.draggingNow) return;
        const isSelected = _this.model.marker.isSelected(d);
        _this.model.marker.selectMarker(d);
        //return to highlighted state
        if (!utils.isTouchDevice()) {
          if (isSelected) _this.model.marker.highlightMarker(d);
          _this.highlightDataPoints();
        }
      }
    };
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
    this.year.setText(this.model.time.formatDate(this.time, "ui"), this.duration);
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  updateSize() {


    const profiles = {
      small: {
        margin: { top: 30, right: 10, left: 40, bottom: 35 },
        padding: 2,
        minRadius: 0.5,
        maxRadius: 30,
        infoElHeight: 16,
        yAxisTitleBottomMargin: 6,
        xAxisTitleBottomMargin: 4
      },
      medium: {
        margin: { top: 40, right: 15, left: 60, bottom: 55 },
        padding: 2,
        minRadius: 1,
        maxRadius: 55,
        infoElHeight: 20,
        yAxisTitleBottomMargin: 6,
        xAxisTitleBottomMargin: 5
      },
      large: {
        margin: { top: 50, right: 20, left: 60, bottom: 60 },
        padding: 2,
        minRadius: 1,
        maxRadius: 65,
        infoElHeight: 22,
        yAxisTitleBottomMargin: 6,
        xAxisTitleBottomMargin: 5,
        hideSTitle: true
      }
    };

    const presentationProfileChanges = {
      "medium": {
        margin: { top: 80, bottom: 80, left: 100 },
        yAxisTitleBottomMargin: 20,
        xAxisTitleBottomMargin: 20,
        infoElHeight: 26,
      },
      "large": {
        margin: { top: 80, bottom: 100, left: 100 },
        yAxisTitleBottomMargin: 20,
        xAxisTitleBottomMargin: 20,
        infoElHeight: 32,
        hideSTitle: true
      }
    };

    const _this = this;

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);
    const margin = this.activeProfile.margin;
    const infoElHeight = this.activeProfile.infoElHeight;

    //labels
    _this._labels.setCloseCrossHeight(_this.activeProfile.infoElHeight * 1.2);

    //stage
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if (this.height <= 0 || this.width <= 0) return utils.warn("Bubble chart updateSize() abort: vizabi container is too little or has display:none");

    //graph group is shifted according to margins (while svg element is at 100 by 100%)
    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.resize(this.width, this.height);
    this.eventArea
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));

    //update scales to the new range
    if (this.model.marker.axis_y.scaleType !== "ordinal") {
      this.yScale.range(this._rangeBump([this.height, 0]));
    } else {
      this.yScale.rangePoints([this.height, 0], _this.activeProfile.padding).range();
    }
    if (this.model.marker.axis_x.scaleType !== "ordinal") {
      this.xScale.range(this._rangeBump([0, this.width]));
    } else {
      this.xScale.rangePoints([0, this.width], _this.activeProfile.padding).range();
    }

    //apply scales to axes and redraw
    this.yAxis.scale(this.yScale)
      .tickSizeInner(-this.width)
      .tickSizeOuter(0)
      .tickPadding(6)
      .tickSizeMinor(-this.width, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_y.scaleType,
        toolMargin: margin,
        limitMaxTickNumber: 6,
        bump: this.activeProfile.maxRadius / 2,
        viewportLength: this.height,
        formatter: this.model.marker.axis_y.getTickFormatter()
      });

    this.xAxis.scale(this.xScale)
      .tickSizeInner(-this.height)
      .tickSizeOuter(0)
      .tickPadding(6)
      .tickSizeMinor(-this.height, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_x.scaleType,
        toolMargin: margin,
        bump: this.activeProfile.maxRadius / 2,
        viewportLength: this.width,
        formatter: this.model.marker.axis_x.getTickFormatter()
      });


    this.bubbleContainerCrop
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));

    this.labelsContainerCrop
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));

    this.xAxisElContainer
      .attr("width", this.width + 1)
      .attr("height", this.activeProfile.margin.bottom + this.height)
      .attr("y", -1)
      .attr("x", -1);
    this.xAxisEl
      .attr("transform", "translate(1," + (1 + this.height) + ")");

    this.yAxisElContainer
      .attr("width", this.activeProfile.margin.left + this.width)
      .attr("height", Math.max(0, this.height))
      .attr("x", -this.activeProfile.margin.left);
    this.yAxisEl
      .attr("transform", "translate(" + (this.activeProfile.margin.left - 1) + "," + 0 + ")");

    this.yAxisEl.call(this.yAxis);
    this.xAxisEl.call(this.xAxis);

    this.projectionX.attr("y1", _this.yScale.range()[0] + this.activeProfile.maxRadius / 2);
    this.projectionY.attr("x2", _this.xScale.range()[0] - this.activeProfile.maxRadius / 2);


    // reduce font size if the caption doesn't fit
    this._updateSTitle();
    this.sTitleEl
      .attr("transform", "translate(" + this.width + "," + 20 + ") rotate(-90)");

    const isRTL = this.model.locale.isRTL();
    this.yTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + (isRTL ? this.width : 10 - this.activeProfile.margin.left) + ", -" + this.activeProfile.yAxisTitleBottomMargin + ")");

    this.xTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + (isRTL ? this.width : 0) + "," + (this.height + margin.bottom - this.activeProfile.xAxisTitleBottomMargin) + ")");

    const ySeparator = this.strings.unit.Y ? ", " : "";
    const yTitleText = this.yTitleEl.select("text").text(this.strings.title.Y + ySeparator + this.strings.unit.Y);
    if (yTitleText.node().getBBox().width > this.width) yTitleText.text(this.strings.title.Y);

    const xSeparator = this.strings.unit.Y ? ", " : "";
    const xTitleText = this.xTitleEl.select("text").text(this.strings.title.X + xSeparator + this.strings.unit.X);
    if (xTitleText.node().getBBox().width > this.width - 100) xTitleText.text(this.strings.title.X);

    if (this.yInfoEl.select("svg").node()) {
      const titleBBox = this.yTitleEl.node().getBBox();
      const t = utils.transform(this.yTitleEl.node());
      const hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * 0.4);

      this.yInfoEl.select("svg")
        .attr("width", infoElHeight + "px")
        .attr("height", infoElHeight + "px");
      this.yInfoEl.attr("transform", "translate("
        + hTranslate + ","
        + (t.translateY - infoElHeight * 0.8) + ")");
    }

    if (this.xInfoEl.select("svg").node()) {
      const titleBBox = this.xTitleEl.node().getBBox();
      const t = utils.transform(this.xTitleEl.node());
      const hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * 0.4);

      this.xInfoEl.select("svg")
        .attr("width", infoElHeight + "px")
        .attr("height", infoElHeight + "px");
      this.xInfoEl.attr("transform", "translate("
        + hTranslate + ","
        + (t.translateY - infoElHeight * 0.8) + ")");
    }

    this._resizeDataWarning();
  },


  _updateLineEqualXY(duration) {
    const oneMeasure = this.model.marker.axis_x.which == this.model.marker.axis_y.which;
    this.lineEqualXY.classed("vzb-invisible", !oneMeasure);
    if (!oneMeasure) return;

    const min = d3.min(this.yScale.domain().concat(this.xScale.domain()));
    const max = d3.max(this.yScale.domain().concat(this.xScale.domain()));

    this.lineEqualXY
      .transition()
      .duration(duration || 0)
      .attr("y1", this.yScale(min))
      .attr("y2", this.yScale(max))
      .attr("x1", this.xScale(min))
      .attr("x2", this.xScale(max));
  },

  _resizeDataWarning() {
    // reset font size to remove jumpy measurement
    const dataWarningText = this.dataWarningEl.select("text").style("font-size", null);

    // reduce font size if the caption doesn't fit
    const dataWarningWidth = dataWarningText.node().getBBox().width + dataWarningText.node().getBBox().height * 3;
    const remainingWidth = this.width - this.xTitleEl.node().getBBox().width - this.activeProfile.infoElHeight;
    const font = parseInt(dataWarningText.style("font-size")) * remainingWidth / dataWarningWidth;
    dataWarningText.style("font-size", dataWarningWidth > remainingWidth ? font + "px" : null);

    // position the warning icon
    const warnBB = dataWarningText.node().getBBox();
    this.dataWarningEl.select("svg")
      .attr("width", warnBB.height * 0.75)
      .attr("height", warnBB.height * 0.75)
      .attr("x", -warnBB.width - warnBB.height * 1.2)
      .attr("y", -warnBB.height * 0.65);

    this.dataWarningEl
      .attr("transform", "translate("
        + (this.model.locale.isRTL() ? warnBB.width + warnBB.height : this.width) + ","
        + (this.height + this.activeProfile.margin.bottom - this.activeProfile.xAxisTitleBottomMargin)
        + ")");
  },

  updateMarkerSizeLimits() {
    const _this = this;
    const extent = this.model.marker.size.extent || [0, 1];

    if (!this.activeProfile) return utils.warn("updateMarkerSizeLimits() is called before ready(). This can happen if events get unfrozen and getFrame() still didn't return data");

    const minRadius = this.activeProfile.minRadius;
    const maxRadius = this.activeProfile.maxRadius;

    this.minRadius = Math.max(maxRadius * extent[0], minRadius);
    this.maxRadius = Math.max(maxRadius * extent[1], minRadius);

    if (this.model.marker.size.scaleType !== "ordinal") {
      this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
    } else {
      this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], _this.activeProfile.padding).range();
    }

  },

  redrawDataPointsOnlyColors() {
    const _this = this;
    if (!this.entityBubbles) return utils.warn("redrawDataPointsOnlyColors(): no entityBubbles defined. likely a premature call, fix it!");

    let valuesNow;
    const KEY = this.KEY;


    let time = this.model.time.value;

    if (this.model.ui.chart.lockNonSelected && this.someSelected) {
      time = this.model.time.parse("" + this.model.ui.chart.lockNonSelected);
    }
    this.model.marker.getFrame(time, valuesLocked => {
      if (!_this._frameIsValid(valuesLocked)) return utils.warn("redrawDataPointsOnlyColor: empty data received from marker.getFrame(). doing nothing");

      valuesNow = _this.frame;
      _this.entityBubbles.each(function(d, index) {

        const selected = _this.model.marker.isSelected(d);

        const valueC = selected ? valuesNow.color[d[KEY]] : valuesLocked.color[d[KEY]];

        const scaledC = valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH;

        d3.select(this).style("fill", scaledC);

      //update lines of labels
        if (selected) {

          const select = utils.find(_this.model.marker.select, f => f[KEY] == d[KEY]);

          const trailStartTime = _this.model.time.parse("" + select.trailStartTime);

          _this.model.marker.getFrame(trailStartTime, valuesTrailStart => {
            if (!valuesTrailStart) return utils.warn("redrawDataPointsOnlyColor: empty data received from marker.getFrames(). doing nothing");

            const cache = {};
            if (!_this.model.ui.chart.trails || trailStartTime - _this.time == 0) {
              cache.scaledC0 = scaledC;
            } else {
              const valueC = valuesTrailStart.color[d[KEY]];
              cache.scaledC0 = valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH;
            }

            _this._labels.updateLabelOnlyColor(d, index, cache);

          });
        }
      });
    });

  },

  redrawDataPointsOnlySize() {
    const _this = this;

    let valuesNow;
    const KEY = this.KEY;


    let time = this.model.time.value;

    if (this.model.ui.chart.lockNonSelected && this.someSelected) {
      time = this.model.time.parse("" + this.model.ui.chart.lockNonSelected);
    }
    this.model.marker.getFrame(time, valuesLocked => {
      if (!_this._frameIsValid(valuesLocked)) return utils.warn("redrawDataPointsOnlySize: empty data received from marker.getFrame(). doing nothing");

      valuesNow = _this.frame;
      _this.entityBubbles.each(function(d, index) {

        const selected = _this.model.marker.isSelected(d);

        const valueS = selected ? valuesNow.size[d[KEY]] : valuesLocked.size[d[KEY]];
        if (valueS == null) return;

        const scaledS = utils.areaToRadius(_this.sScale(valueS));
        d3.select(this).attr("r", scaledS);

      //update lines of labels
        if (selected) {

          const select = utils.find(_this.model.marker.select, f => f[KEY] == d[KEY]);

          const trailStartTime = _this.model.time.parse("" + select.trailStartTime);

          _this.model.marker.getFrame(trailStartTime, valuesTrailStart => {
            if (!valuesTrailStart) return utils.warn("redrawDataPointsOnlySize: empty data received from marker.getFrames(). doing nothing");

            const cache = {};
            if (!_this.model.ui.chart.trails || trailStartTime - _this.time == 0) {
              cache.scaledS0 = scaledS;
            } else {
              cache.scaledS0 = utils.areaToRadius(_this.sScale(valuesTrailStart.size[d[KEY]]));
            }

            _this._labels.updateLabelOnlyPosition(d, index, cache);

          });
        }
      });
    });
  },

  /*
   * REDRAW DATA POINTS:
   * Here plotting happens
   * debouncing to improve performance: events might trigger it more than 1x
   */
  redrawDataPoints(duration) {
    const _this = this;
    const KEY = this.KEY;
    if (duration == null) duration = _this.duration;

    if (this.model.ui.chart.lockNonSelected && this.someSelected) {
      const time = this.model.time.parse("" + this.model.ui.chart.lockNonSelected);

        //get values for locked frames
      this.model.marker.getFrame(time, lockedFrame => {
        if (!lockedFrame) return utils.warn("redrawDataPoints: empty data received from marker.getFrames(). doing nothing");

            // each bubble
        _this.entityBubbles.each(function(d, index) {
          const frame = _this.model.marker.isSelected(d) ? _this.frame : lockedFrame;
          _this._updateBubble(d, frame, index, d3.select(this), duration);
        });
      });
    } else {
        // each bubble
      _this.entityBubbles.each(function(d, index) {
        _this._updateBubble(d, _this.frame, index, d3.select(this), duration);
      });
    }

    this._updateLineEqualXY(duration);
  },

  //redraw Data Points
  _updateBubble(d, values, index, view, duration) {
    const _this = this;
    const KEY = this.KEY;

    let showhide = false;

    const valueY = values.axis_y[d[KEY]];
    const valueX = values.axis_x[d[KEY]];
    const valueS = values.size[d[KEY]];
    const valueL = values.label[d[KEY]];
    const valueC = values.color[d[KEY]];
    const valueLST = values.size_label[d[KEY]];

    // check if fetching data succeeded
    if (!valueL && valueL !== 0 || !valueY && valueY !== 0 || !valueX && valueX !== 0 || !valueS && valueS !== 0) {
      // if entity is missing data it should hide
      if (!d.hidden) {
        d.hidden = true;
        showhide = true;
      }

      if (showhide) {
        if (duration) {
          const opacity = view.style("opacity");
          view.transition().duration(duration).ease(d3.easeExp)
            .style("opacity", 0)
            .on("end", () => {
                    //to avoid transition from null state add class with a delay
              view.classed("vzb-invisible", d.hidden);
              view.style("opacity", opacity);
            });
        } else {
               //immediately hide the bubble
          view.classed("vzb-invisible", d.hidden);
        }
      }
    } else {
      if (d.hidden || view.classed("vzb-invisible")) {
        d.hidden = false;
        showhide = true;
      }


      // if entity has all the data we update the visuals
      const scaledS = utils.areaToRadius(_this.sScale(valueS));

      view.style("fill", valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH);

      if (duration) {
        if (showhide) {
          const opacity = view.style("opacity");
          view.classed("vzb-invisible", d.hidden);
          view.style("opacity", 0)
            .attr("cy", _this.yScale(valueY))
            .attr("cx", _this.xScale(valueX))
            .attr("r", scaledS)
            .transition().duration(duration).ease(d3.easeExp)
            .style("opacity", opacity);
        } else {
          view.transition().duration(duration).ease(d3.easeLinear)
            .attr("cy", _this.yScale(valueY))
            .attr("cx", _this.xScale(valueX))
            .attr("r", scaledS);
        }

      } else {

        //interrupt the ongoing transition and immediately do the visual updates
        view.interrupt()
          .attr("cy", _this.yScale(valueY))
          .attr("cx", _this.xScale(valueX))
          .attr("r", scaledS)
          .transition();

        //show entity if it was hidden
        if (showhide) view.classed("vzb-invisible", d.hidden);
      }

      if (this.model.time.record) _this._export.write({
        type: "circle",
        id: d[KEY],
        time: this.model.time.value.getUTCFullYear(),
        fill: valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH,
        cx: _this.xScale(valueX),
        cy: _this.yScale(valueY),
        r: scaledS
      });

    } // data exists
    _this._updateLabel(d, index, valueX, valueY, valueS, valueC, valueL, valueLST, duration, showhide);
  },

  _updateLabel(d, index, valueX, valueY, valueS, valueC, valueL, valueLST, duration, showhide) {
    const _this = this;
    const KEY = this.KEY;

    // only for selected markers
    if (_this.model.marker.isSelected(d)) {

      const cache = {};

      const select = utils.find(_this.model.marker.select, f => f[KEY] == d[KEY]);

      const time = _this.model.time.formatDate(_this.time);
      if (!this.model.ui.chart.trails || select.trailStartTime == time || select.trailStartTime == null) {
        if (this.model.ui.chart.trails && select.trailStartTime == null) select.trailStartTime = time; // need only when trailStartTime == null

        cache.labelX0 = valueX;
        cache.labelY0 = valueY;
        cache.scaledC0 = valueC != null ? _this.cScale(valueC) : _this.COLOR_WHITEISH,
        cache.scaledS0 = (valueS || valueS === 0) ? utils.areaToRadius(_this.sScale(valueS)) : null;
      }

      const trailStartTime = _this.model.time.parse("" + select.trailStartTime);

      const labelText = valueL + (_this.model.ui.chart.trails ? " " + select.trailStartTime : "");

      if (showhide && d.hidden && _this.model.ui.chart.trails && trailStartTime && (trailStartTime < _this.time)) showhide = false;
      if (d.hidden && !_this.model.ui.chart.trails) showhide = true;

      this._labels.updateLabel(d, index, cache, valueX, valueY, valueS, valueC, labelText, valueLST, duration, showhide);

    }
  },

  _formatSTitleValues(titleS, titleC) {
    const _this = this;
    const unitS = this.strings.unit.S;
    const unitC = this.strings.unit.C;

    const formatterS = this.model.marker.size.getTickFormatter();
    const formatterC = this.model.marker.color.getTickFormatter();

    //resolve labels for colors via the color legend
    if (this.model.marker.color.isDiscrete() && this.model.marker.color.use !== "constant" && titleC && this.model.marker.color.getColorlegendMarker()) {
      titleC = this.model.marker.color.getColorlegendMarker().label.getItems()[titleC] || "";
    }

    return [formatterS(titleS) + " " + unitS,
      titleC || titleC === 0 ? formatterC(titleC) + " " + unitC : this.translator("hints/nodata")];
  },

  _updateSTitle(titleS, titleC) {

    // vertical text about size and color
    if (this.activeProfile.hideSTitle
        && this.model.ui.dialogs.sidebar.indexOf("colors") > -1
        && this.model.ui.dialogs.sidebar.indexOf("size") > -1) {
      this.sTitleEl.classed("vzb-invisible", true);
      return;
    }
    if (this.sTitleEl.classed("vzb-invisible")) {
      this.sTitleEl.classed("vzb-invisible", false);
    }
    const sTitleContentON = this.model.marker.size.use !== "constant";
    const cTitleContentON = this.model.marker.color.use !== "constant";
    const sTitleText = this.sTitleEl.select("text")
      // reset font size to remove jumpy measurement
      .style("font-size", null)
      .text(
      (sTitleContentON ? this.translator("buttons/size") + ": " + (titleS ? titleS : this.strings.title.S) : "") +
      (sTitleContentON && cTitleContentON ? ", " : "") +
      (cTitleContentON ? this.translator("buttons/colors") + ": " + (titleC ? titleC : this.strings.title.C) : "")
    );
    const sTitleWidth = sTitleText.node().getBBox().width;
    const remainigHeight = this.height - 30;
    const font = parseInt(sTitleText.style("font-size")) * remainigHeight / sTitleWidth;
    sTitleText.style("font-size", sTitleWidth > remainigHeight ? font + "px" : null);
  },

  selectDataPoints() {
    const _this = this;
    const KEY = this.KEY;

    if (utils.isTouchDevice()) {
      _this.model.marker.clearHighlighted();
      _this._labels.showCloseCross(null, false);
    } else {
      //hide tooltip
      _this._setTooltip();
      _this._setBubbleCrown();
    }

    _this.someSelected = (_this.model.marker.select.length > 0);
    _this.nonSelectedOpacityZero = false;
  },

  _setBubbleCrown(x, y, r, glow, skipInnerFill) {
    if (x != null) {
      this.bubbleCrown.classed("vzb-hidden", false);
      this.bubbleCrown.select(".vzb-crown")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", r)
        .attr("fill", skipInnerFill ? "none" : glow);
      this.bubbleCrown.selectAll(".vzb-crown-glow")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", r + 10)
        .attr("stroke", glow);

    } else {
      this.bubbleCrown.classed("vzb-hidden", true);
    }

  },

  _setTooltip(tooltipText, x, y, offset, glow) {
    if (tooltipText) {
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
      this.tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")");

      this.tooltip.selectAll("rect")
        .attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * 0.85)
        .attr("rx", contentBBox.height * 0.2)
        .attr("ry", contentBBox.height * 0.2);

      this.tooltip.select(".vzb-tooltip-glow")
        .attr("stroke", glow);

    } else {
      this.tooltip.classed("vzb-hidden", true);
    }
  },

  /*
   * Shows and hides axis projections
   */
  _axisProjections(d) {
    const _this = this;
    const TIMEDIM = this.TIMEDIM;
    const KEY = this.KEY;

    if (d != null) {

      this.model.marker.getFrame(d[TIMEDIM], values => {
        const valueY = values.axis_y[d[KEY]];
        const valueX = values.axis_x[d[KEY]];
        const valueS = values.size[d[KEY]];
        const radius = utils.areaToRadius(_this.sScale(valueS));

        if (!valueY && valueY !== 0 || !valueX && valueX !== 0 || !valueS && valueS !== 0) return;

        if (_this.model.ui.chart.whenHovering.showProjectionLineX
          && _this.xScale(valueX) > 0 && _this.xScale(valueX) < _this.width
          && (_this.yScale(valueY) + radius) < _this.height) {
          _this.projectionX
            .style("opacity", 1)
            .attr("y2", _this.yScale(valueY) + radius)
            .attr("x1", _this.xScale(valueX))
            .attr("x2", _this.xScale(valueX));
        }

        if (_this.model.ui.chart.whenHovering.showProjectionLineY
          && _this.yScale(valueY) > 0 && _this.yScale(valueY) < _this.height
          && (_this.xScale(valueX) - radius) > 0) {
          _this.projectionY
            .style("opacity", 1)
            .attr("y1", _this.yScale(valueY))
            .attr("y2", _this.yScale(valueY))
            .attr("x1", _this.xScale(valueX) - radius);
        }

        if (_this.model.ui.chart.whenHovering.higlightValueX) _this.xAxisEl.call(
          _this.xAxis.highlightValue(valueX)
        );

        if (_this.model.ui.chart.whenHovering.higlightValueY) _this.yAxisEl.call(
          _this.yAxis.highlightValue(valueY)
        );
      });

    } else {

      this.projectionX.style("opacity", 0);
      this.projectionY.style("opacity", 0);
      this.xAxisEl.call(this.xAxis.highlightValue("none"));
      this.yAxisEl.call(this.yAxis.highlightValue("none"));

    }

  },

  /*
   * Highlights all hovered bubbles
   */
  highlightDataPoints() {
    const _this = this;
    const TIMEDIM = this.TIMEDIM;
    const KEY = this.KEY;

    this.someHighlighted = (this.model.marker.highlight.length > 0);

    this.updateBubbleOpacity();

    if (this.model.marker.highlight.length === 1) {
      const d = utils.clone(this.model.marker.highlight[0]);

      if (_this.model.ui.chart.lockNonSelected && _this.someSelected && !_this.model.marker.isSelected(d)) {
        d[TIMEDIM] = _this.model.time.parse("" + _this.model.ui.chart.lockNonSelected);
      } else {
        d[TIMEDIM] = _this.model.time.parse("" + d.trailStartTime) || _this.time;
      }

      _this.model.marker.getFrame(d[TIMEDIM], values => {
        if (!values) return;
        const x = _this.xScale(values.axis_x[d[KEY]]);
        const y = _this.yScale(values.axis_y[d[KEY]]);
        const s = utils.areaToRadius(_this.sScale(values.size[d[KEY]]));
        const c = values.color[d[KEY]] != null ? _this.cScale(values.color[d[KEY]]) : _this.COLOR_WHITEISH;
        let entityOutOfView = false;

        const titles = _this._formatSTitleValues(values.size[d[KEY]], values.color[d[KEY]]);
        _this._updateSTitle(titles[0], titles[1]);
        if (x + s < 0 || x - s > _this.width || y + s < 0 || y - s > _this.height) {
          entityOutOfView = true;
        }

          //show tooltip
        let text = "";
        let hoverTrail = false;
        if (_this.model.marker.isSelected(d) && _this.model.ui.chart.trails) {
          text = _this.model.time.formatDate(_this.time);
          const selectedData = utils.find(_this.model.marker.select, f => f[KEY] == d[KEY]);
          hoverTrail = text !== selectedData.trailStartTime && !d3.select(d3.event.target).classed("bubble-" + d[KEY]);
          text = text !== selectedData.trailStartTime && _this.time === d[TIMEDIM] ? text : "";
        } else {
          text = _this.model.marker.isSelected(d) ? "" : values.label[d[KEY]];
        }

        _this._labels.highlight(null, false);
        _this._labels.highlight(d, true);
        if (_this.model.marker.isSelected(d)) {
          const skipCrownInnerFill = !d.trailStartTime || d.trailStartTime == _this.model.time.formatDate(_this.time);
          _this._setBubbleCrown(x, y, s, c, skipCrownInnerFill);
        }

        if (!entityOutOfView && !hoverTrail) {
          _this._axisProjections(d);
        }

          //set tooltip and show axis projections
        if (text && !entityOutOfView && !hoverTrail) {
          _this._setTooltip(text, x, y, s + 3, c);
        }

        const selectedData = utils.find(_this.model.marker.select, f => f[KEY] == d[KEY]);
        if (selectedData) {
          const clonedSelectedData = utils.clone(selectedData);
            //change opacity to OPACITY_HIGHLT = 1.0;
          clonedSelectedData.opacity = 1.0;
          _this._trails.run(["opacityHandler"], clonedSelectedData);
        }
      });
    } else {
      this._axisProjections();
      this._trails.run(["opacityHandler"]);
        //hide tooltip
      _this._updateSTitle();
      this._setTooltip();
      this._setBubbleCrown();
      this._labels.highlight(null, false);
    }

  },

  updateBubbleOpacity(duration) {
    const _this = this;
    //if(!duration)duration = 0;

    const OPACITY_HIGHLT = 1.0;
    const OPACITY_HIGHLT_DIM = this.model.marker.opacityHighlightDim;
    const OPACITY_SELECT = this.model.marker.opacityRegular;
    const OPACITY_REGULAR = this.model.marker.opacityRegular;
    const OPACITY_SELECT_DIM = this.model.marker.opacitySelectDim;

    this.entityBubbles
      //.transition().duration(duration)
      .style("opacity", d => {

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


    const nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < 0.01;

    // when pointer events need update...
    if (nonSelectedOpacityZero != this.nonSelectedOpacityZero) {
      this.entityBubbles.style("pointer-events", d => (!_this.someSelected || !nonSelectedOpacityZero || _this.model.marker.isSelected(d)) ?
          "visible" : "none");
    }

    this.nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < 0.01;
  }

});

export default BubbleChartComp;
