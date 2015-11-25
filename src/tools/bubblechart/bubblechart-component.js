import * as utils from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals';

import Trail from './bubblechart-trail';
import PanZoom from './bubblechart-panzoom';
import Exporter from 'helpers/svgexport';
import axisSmart from 'helpers/d3.axisWithLabelPicker';
import DynamicBackground from 'helpers/d3.dynamicBackground';

import {
  warn as iconWarn,
  question as iconQuestion,
  close as iconClose
} from 'base/iconset';



//BUBBLE CHART COMPONENT
var BubbleChartComp = Component.extend({

  /**
   * Initializes the component (Bubble Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init: function(config, context) {
    var _this = this;
    this.name = 'bubblechart';
    this.template = 'bubblechart.html';

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
      name: "language",
      type: "language"
    }, {
      name: "ui",
      type: "model"
    }];

    //starts as splash if this is the option
    this._splash = config.ui.splash;

    this.model_binds = {
      'change:time': function(evt, original) {
        if(_this._splash !== _this.model.time.splash) {
          if(!_this._readyOnce) return;
          _this._splash = _this.model.time.splash;
          //TODO: adjust X & Y axis here
        }
      },
      'change:time:start': function(evt, original) {
        if(_this.model.marker.color.scaleType === 'time') {
          _this.model.marker.color.scale = null;
        }
      },
      "change:time:record": function() {
        //console.log("change time record");
        if(_this.model.time.record) {
          _this._export.open(this.element, this.name);
        } else {
          _this._export.reset();
        }
      },
      "change:time:trails": function(evt) {
        //console.log("EVENT change:time:trails");
        _this._trails.toggle(_this.model.time.trails);
        _this.redrawDataPoints();
      },
      "change:time:lockNonSelected": function(evt) {
        //console.log("EVENT change:time:lockNonSelected");
        _this.redrawDataPoints(500);
      },
      "change:marker": function(evt) {
        // bubble size change is processed separately
        if(!_this._readyOnce) return;
        if(evt.indexOf("change:marker:size") !== -1) return;
        if(evt.indexOf("change:marker:color:palette") > -1) return;
        if(evt.indexOf("min") > -1 || evt.indexOf("max") > -1) {
          _this.updateSize();
          _this.updateMarkerSizeLimits();
          _this._trails.run("findVisible");
          _this.redrawDataPoints();
          _this._trails.run("resize");
          return;
        }
        if(evt.indexOf("fakeMin") > -1 || evt.indexOf("fakeMax") > -1) {
          if(_this.draggingNow)return;
            _this._panZoom.zoomToMaxMin(
              _this.model.marker.axis_x.fakeMin,
              _this.model.marker.axis_x.fakeMax,
              _this.model.marker.axis_y.fakeMin,
              _this.model.marker.axis_y.fakeMax,
              500
          )
          return;
        }

        if(evt.indexOf("which") > -1 || evt.indexOf("use") > -1) return;

        _this.ready();
        //console.log("EVENT change:marker", evt);
      },
      "change:entities:select": function() {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:entities:select");
        _this.selectDataPoints();
        _this.redrawDataPoints();
        _this._trails.run(["resize", "recolor", "opacityHandler","findVisible", "reveal"]);
        _this.updateBubbleOpacity();
        _this._updateDoubtOpacity();
      },
      "change:entities:highlight": function() {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:entities:highlight");
        _this.highlightDataPoints();
      },
      'change:time:value': function() {
        //console.log("EVENT change:time:value");
        _this.updateTime();
        _this._updateDoubtOpacity();

        _this._trails.run("findVisible");
        if(_this.model.time.adaptMinMaxZoom) {
          _this._panZoom.expandCanvas();
        } else {
          _this.redrawDataPoints();
        }
        _this._trails.run("reveal");
        _this.tooltipMobile.classed('vzb-hidden', true);
        //_this._bubblesInteract().mouseout();
      },
      'change:time:adaptMinMaxZoom': function() {
        //console.log("EVENT change:time:adaptMinMaxZoom");
        if(_this.model.time.adaptMinMaxZoom) {
          _this._panZoom.expandCanvas();
        } else {
          _this._panZoom.reset();
        }
      },
      'change:marker:size': function(evt) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        if(evt.indexOf("min") > -1 || evt.indexOf("max") > -1) {
            _this.updateMarkerSizeLimits();
            _this._trails.run("findVisible");
            _this.redrawDataPointsOnlySize();
            _this._trails.run("resize");
            return;
        }
        _this.ready();
      },
      'change:marker:color:palette': function() {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:marker:color:palette");
        _this.redrawDataPointsOnlyColors();
        _this._trails.run("recolor");
      },
      'change:entities:opacitySelectDim': function() {
        _this.updateBubbleOpacity();
      },
      'change:entities:opacityRegular': function() {
        _this.updateBubbleOpacity();
        _this._trails.run("opacityHandler");        
      },
      'ready': function() {
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

    this.xAxis = axisSmart();
    this.yAxis = axisSmart();


    this.cached = {};
    this.xyMaxMinMean = {};
    this.currentZoomFrameXY = null;
    this.draggingNow = null;

    // default UI settings
    this.ui = utils.extend({
      whenHovering: {},
      labels: {}
    }, this.ui["vzb-tool-" + this.name]);

    this.ui.whenHovering = utils.extend({
      showProjectionLineX: true,
      showProjectionLineY: true,
      higlightValueX: true,
      higlightValueY: true
    }, this.ui.whenHovering);

    this.ui.labels = utils.extend({
      autoResolveCollisions: false,
      dragging: true
    }, this.ui.labels);

    this._trails = new Trail(this);
    this._panZoom = new PanZoom(this);
    this._export = new Exporter(this);
    this._export
      .prefix("vzb-bc-")
      .deleteClasses(["vzb-bc-bubbles-crop", "vzb-hidden", "vzb-bc-year", "vzb-bc-zoom-rect",
        "vzb-bc-projection-x", "vzb-bc-projection-y", "vzb-bc-axis-c-title"
      ]);



    //            this.collisionResolver = d3.svg.collisionResolver()
    //                .value("labelY2")
    //                .fixed("labelFixed")
    //                .selector("text")
    //                .scale(this.yScale)
    //                .handleResult(this._repositionLabels);


    this.labelDragger = d3.behavior.drag()
      .on("dragstart", function(d, i) {
        d3.event.sourceEvent.stopPropagation();
        var KEY = _this.KEY;
        _this.druging = d[KEY];
      })
      .on("drag", function(d, i) {
        var KEY = _this.KEY;
        if(!_this.ui.labels.dragging) return;
        var cache = _this.cached[d[KEY]];
        cache.labelFixed = true;


        cache.labelX_ += d3.event.dx / _this.width;
        cache.labelY_ += d3.event.dy / _this.height;

        var resolvedX = _this.xScale(cache.labelX0) + cache.labelX_ * _this.width;
        var resolvedY = _this.yScale(cache.labelY0) + cache.labelY_ * _this.height;

        var resolvedX0 = _this.xScale(cache.labelX0);
        var resolvedY0 = _this.yScale(cache.labelY0);

        var lineGroup = _this.entityLines.filter(function(f) {
          return f[KEY] == d[KEY];
        });

        _this._repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, 0, lineGroup);
      })
      .on("dragend", function(d, i) {
        var KEY = _this.KEY;
        _this.druging = null;
        _this.model.entities.setLabelOffset(d, [
          _this.cached[d[KEY]].labelX_,
          _this.cached[d[KEY]].labelY_
        ]);
      });



  },




  _rangeBump: function(arg, undo) {
    var bump = this.activeProfile.maxRadius;
    undo = undo?-1:1;
    if(utils.isArray(arg) && arg.length > 1) {
      var z1 = arg[0];
      var z2 = arg[arg.length - 1];

      //the sign of bump depends on the direction of the scale
      if(z1 < z2) {
        z1 += bump * undo;
        z2 -= bump * undo;
        // if the scale gets inverted because of bump, set it to avg between z1 and z2
        if(z1 > z2) z1 = z2 = (z1 + z2) / 2;
      } else if(z1 > z2) {
        z1 -= bump * undo;
        z2 += bump * undo;
        // if the scale gets inverted because of bump, set it to avg between z1 and z2
        if(z1 < z2) z1 = z2 = (z1 + z2) / 2;
      } else {
        utils.warn("rangeBump error: the input scale range has 0 length. that sucks");
      }
      return [z1, z2];
    } else {
      utils.warn("rangeBump error: input is not an array or empty");
    }
  },

//  _marginUnBump: function(arg) {
//    var bump = this.profiles[this.getLayoutProfile()].maxRadius;
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
  readyOnce: function() {
    var _this = this;

    this.scrollableAncestor = utils.findScrollableAncestor(this.element);
    this.element = d3.select(this.element);

    // reference elements
    this.graph = this.element.select('.vzb-bc-graph');
    this.yAxisElContainer = this.graph.select('.vzb-bc-axis-y');
    this.yAxisEl = this.yAxisElContainer.select('g');

    this.xAxisElContainer = this.graph.select('.vzb-bc-axis-x');
    this.xAxisEl = this.xAxisElContainer.select('g');

    this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
    this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
    this.sTitleEl = this.graph.select('.vzb-bc-axis-s-title');
    this.cTitleEl = this.graph.select('.vzb-bc-axis-c-title');
    this.yearEl = this.graph.select('.vzb-bc-year');

    this.year = new DynamicBackground(this.yearEl);

    this.yInfoEl = this.graph.select('.vzb-bc-axis-y-info');
    this.xInfoEl = this.graph.select('.vzb-bc-axis-x-info');
    this.dataWarningEl = this.graph.select('.vzb-data-warning');

    this.projectionX = this.graph.select(".vzb-bc-projection-x");
    this.projectionY = this.graph.select(".vzb-bc-projection-y");

    this.trailsContainer = this.graph.select('.vzb-bc-trails');
    this.bubbleContainerCrop = this.graph.select('.vzb-bc-bubbles-crop');
    this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
    this.labelsContainer = this.graph.select('.vzb-bc-labels');
    this.linesContainer = this.graph.select('.vzb-bc-lines');
    this.zoomRect = this.element.select('.vzb-bc-zoom-rect');
    this.eventArea = this.element.select('.vzb-bc-eventarea');

    this.entityBubbles = null;
    this.entityLabels = null;
    this.tooltip = this.element.select('.vzb-bc-tooltip');
    this.tooltipMobile = this.element.select('.vzb-tooltip-mobile');
    this.entityLines = null;
    //component events
    this.on("resize", function() {
      //console.log("EVENT: resize");
      _this.updateSize();
      _this.updateMarkerSizeLimits();
      _this._trails.run("findVisible");
      _this._panZoom.reset(); // includes redraw data points and trail resize
    });

    //keyboard listeners
    d3.select("body")
      .on("keydown", function() {
        if(d3.event.metaKey || d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", true);
      })
      .on("keyup", function() {
        if(!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
      });

    this.bubbleContainerCrop
      .call(this._panZoom.zoomer)
      .call(this._panZoom.dragRectangle)
      .on('dblclick.zoom', null)
      .on("mouseup", function() {
        _this.draggingNow = false;
      })

    d3.select(this.parent.placeholder)
      .onTap(function() {
        _this._panZoom.enabled = true;
//        _this._bubblesInteract().mouseout();
//        _this.tooltipMobile.classed('vzb-hidden', true);
      })
      .on("mousedown", function(){
        _this._panZoom.enabled = true;
      })
      .on("mouseleave", function(){
        clearTimeout(_this.timeoutMouseEnter);
        _this.timeoutMouseLeave = setTimeout(function(){_this._panZoom.enabled = false;}, 800)
      })
      .on("mouseenter", function(){
        clearTimeout(_this.timeoutMouseLeave);
        _this.timeoutMouseEnter = setTimeout(function(){_this._panZoom.enabled = true;}, 2000)
      });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this._calculateAllValues();
    this._valuesCalculated = true; //hack to avoid recalculation

    this.updateUIStrings();

    this.wScale = d3.scale.linear()
      .domain(this.parent.datawarning_content.doubtDomain)
      .range(this.parent.datawarning_content.doubtRange);

    this.updateIndicators();
    this.updateEntities();
    this.updateTime();
    this.updateSize();
    this.updateMarkerSizeLimits();
    this.selectDataPoints();
    this.updateBubbleOpacity();
    this._updateDoubtOpacity();
    this._trails.create();
    this._panZoom.reset(); // includes redraw data points and trail resize
    this._trails.run(["recolor", "opacityHandler", "findVisible", "reveal"]);
    if(this.model.time.adaptMinMaxZoom) this._panZoom.expandCanvas();
  },

  ready: function() {

    if(!this._valuesCalculated) this._calculateAllValues();
    else this._valuesCalculated = false;

    this.updateUIStrings();

    this.updateEntities();
    this.redrawDataPoints();
    this.updateBubbleOpacity();
    this.updateIndicators();
    this.updateSize();
    this.cached = {};
    this.updateMarkerSizeLimits();
    this._trails.create();
    this._trails.run("findVisible");
    this._panZoom.reset();
    this._trails.run(["recolor", "opacityHandler", "reveal"]);

    this._panZoom.zoomToMaxMin(
       this.model.marker.axis_x.fakeMin,
       this.model.marker.axis_x.fakeMax,
       this.model.marker.axis_y.fakeMin,
       this.model.marker.axis_y.fakeMax
    )

  },

  /*
   * UPDATE INDICATORS
   */
  updateIndicators: function() {
    var _this = this;

    //scales
    this.yScale = this.model.marker.axis_y.getScale();
    this.xScale = this.model.marker.axis_x.getScale();
    this.sScale = this.model.marker.size.getScale();
    this.cScale = this.model.marker.color.getScale();

    //            this.collisionResolver.scale(this.yScale);


    this.yAxis.tickFormat(_this.model.marker.axis_y.tickFormatter);
    this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);

    this.xyMaxMinMean = {
      x: this.model.marker.axis_x.getMaxMinMean({
        timeFormatter: this.timeFormatter,
        skipZeros: true
      }),
      y: this.model.marker.axis_y.getMaxMinMean({
        timeFormatter: this.timeFormatter,
        skipZeros: true
      }),
      s: this.model.marker.size.getMaxMinMean({
        timeFormatter: this.timeFormatter,
        skipZeros: true
      })
    };
  },


  updateUIStrings: function() {
    var _this = this;

    this.translator = this.model.language.getTFunction();
    this.timeFormatter = d3.time.format(_this.model.time.formatOutput);
    var indicatorsDB = globals.metadata.indicatorsDB;

    this.strings = {
      title: {
        Y: this.translator("indicator/" + this.model.marker.axis_y.which),
        X: this.translator("indicator/" + this.model.marker.axis_x.which),
        S: this.translator("indicator/" + this.model.marker.size.which),
        C: this.translator("indicator/" + this.model.marker.color.which)
      },
      unit: {
        Y: this.translator("unit/" + indicatorsDB[this.model.marker.axis_y.which].unit) || "",
        X: this.translator("unit/" + indicatorsDB[this.model.marker.axis_x.which].unit) || "",
        S: this.translator("unit/" + indicatorsDB[this.model.marker.size.which].unit) || "",
        C: this.translator("unit/" + indicatorsDB[this.model.marker.color.which].unit) || ""
      }
    }
    if(!!this.strings.unit.Y) this.strings.unit.Y = ", " + this.strings.unit.Y;
    if(!!this.strings.unit.X) this.strings.unit.X = ", " + this.strings.unit.X;
    if(!!this.strings.unit.S) this.strings.unit.S = ", " + this.strings.unit.S;
    if(!!this.strings.unit.C) this.strings.unit.C = ", " + this.strings.unit.C;

    var yTitle = this.yTitleEl.selectAll("text").data([0]);
    yTitle.enter().append("text");
    yTitle
      //.attr("y", "-6px")
      .on("click", function() {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_y")
          .alignX("left")
          .alignY("top")
          .updateView()
          .toggle();
      });

    var xTitle = this.xTitleEl.selectAll("text").data([0]);
    xTitle.enter().append("text");
    xTitle
      .on("click", function() {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_x")
          .alignX("left")
          .alignY("bottom")
          .updateView()
          .toggle();
      });

    var sTitle = this.sTitleEl.selectAll("text").data([0]);
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
    this.yInfoEl.on("click", function() {
      window.open(indicatorsDB[_this.model.marker.axis_y.which].sourceLink, '_blank').focus();
    })
    this.xInfoEl.on("click", function() {
      window.open(indicatorsDB[_this.model.marker.axis_x.which].sourceLink, '_blank').focus();
    })
    this.dataWarningEl
      .on("click", function() {
        _this.parent.findChildByName("gapminder-datawarning").toggle();
      })
      .on("mouseover", function() {
        _this._updateDoubtOpacity(1);
      })
      .on("mouseout", function() {
        _this._updateDoubtOpacity();
      })
  },

  _updateDoubtOpacity: function(opacity) {
    if(opacity == null) opacity = this.wScale(+this.timeFormatter(this.time));
    if(this.someSelected) opacity = 1;
    this.dataWarningEl.style("opacity", opacity);
  },

  /*
   * UPDATE ENTITIES:
   * Ideally should only update when show parameters change or data changes
   */
  updateEntities: function() {
    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.TIMEDIM;

    var getKeys = function(prefix) {
      prefix = prefix || "";
      return this.model.marker.getKeys()
        .map(function(d) {
          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer[TIMEDIM] = endTime;
          pointer.sortValue = values.size[d[KEY]];
          pointer[KEY] = prefix + d[KEY];
          return pointer;
        })
        .sort(function(a, b) {
          return b.sortValue - a.sortValue;
        })
    };

    // get array of GEOs, sorted by the size hook
    // that makes larger bubbles go behind the smaller ones
    var endTime = this.model.time.end;
    var values = this._getValuesInterpolated(endTime);
    this.model.entities.setVisible(getKeys.call(this));

    this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
      .data(this.model.entities.getVisible(), function(d) {
        return d[KEY]
      });

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles.enter().append("circle")
      .attr("class", function(d) {
        return "vzb-bc-entity " + d[KEY];
      })
      .on("mouseover", function(d, i) {
        if(utils.isTouchDevice()) return;
        _this._bubblesInteract().mouseover(d, i);
      })
      .on("mouseout", function(d, i) {
        if(utils.isTouchDevice()) return;

        _this._bubblesInteract().mouseout(d, i);
      })
      .on("click", function(d, i) {
        if(utils.isTouchDevice()) return;

        _this._bubblesInteract().click(d, i);
      })
      .onTap(function(d, i) {
        d3.event.stopPropagation();
        _this._bubblesInteract().click(d, i);
      })
      .onLongTap(function(d, i) {});


    //TODO: no need to create trail group for all entities
    //TODO: instead of :append an :insert should be used to keep order, thus only few trail groups can be inserted
    this.entityTrails = this.bubbleContainer.selectAll(".vzb-bc-entity")
      .data(getKeys.call(this, "trail-"), function(d) {
        return d[KEY];
      });

    this.entityTrails.enter().insert("g", function(d) {
      return document.querySelector(".vzb-bc-bubbles ." + d[KEY].replace("trail-", ""));
    }).attr("class", function(d) {
      return "vzb-bc-entity" + " " + d[KEY]
    });

  },

  _bubblesInteract: function() {
    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.TIMEDIM;

    return {
      mouseover: function(d, i) {
        _this.model.entities.highlightEntity(d);
        var text = "";
        var pointer = {};
        pointer[KEY] = d[KEY];
        pointer[TIMEDIM] = _this.time;
        if(_this.model.entities.isSelected(d) && _this.model.time.trails) {
          text = _this.timeFormatter(_this.time);
          _this.entityLabels
            .filter(function(f) {
              return f[KEY] == d[KEY]
            })
            .classed("vzb-highlighted", true);
        } else {
          if (_this.model.time.lockNonSelected) {
            pointer[TIMEDIM] = _this.model.time.lockNonSelected;
          }
          text = _this.model.marker.label.getValue(d);
        }
        //set tooltip and show axis projections
        var x = _this.xScale(_this.model.marker.axis_x.getValue(pointer));
        var y = _this.yScale(_this.model.marker.axis_y.getValue(pointer));
        var s = utils.areaToRadius(_this.sScale(_this.model.marker.size.getValue(pointer)));
        _this._setTooltip(text, x, y, s);


        //show the little cross on the selected label
        _this.entityLabels
            .filter(function(f){return f[KEY] == d[KEY]})
            .select(".vzb-bc-label-x")
            .classed("vzb-transparent", false);
      },

      mouseout: function(d, i) {
        _this.model.entities.clearHighlighted();
        _this._setTooltip();
        _this.entityLabels.classed("vzb-highlighted", false);

        //hide the little cross on the selected label
        _this.entityLabels
            .filter(function(f){return f[KEY] == d[KEY]})
            .select(".vzb-bc-label-x")
            .classed("vzb-transparent", true);
      },

      click: function(d, i) {
        if(_this.draggingNow) return;
        _this._setTooltip();
        _this.model.entities.selectEntity(d, TIMEDIM, _this.timeFormatter);
      }
    }
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
    this.year.setText(this.timeFormatter(this.time));
    //this.yearEl.text(this.timeFormatter(this.time));
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  updateSize: function() {


    var profiles = {
      small: {
        margin: { top: 30, right: 10, left: 40, bottom: 45 },
        padding: 2,
        minRadius: 0.5,
        maxRadius: 40,
        infoElHeight: 16,
        yAxisLabelBottomMargin: 6,
        xAxisLabelBottomMargin: 4
      },
      medium: {
        margin: { top: 40, right: 15, left: 60, bottom: 55 },
        padding: 2,
        minRadius: 1,
        maxRadius: 55,
        infoElHeight: 20,
        yAxisLabelBottomMargin: 6,
        xAxisLabelBottomMargin: 5
      },
      large: {
        margin: { top: 50, right: 20, left: 60, bottom: 60 },
        padding: 2,
        minRadius: 1,
        maxRadius: 70,
        infoElHeight: 22,
        yAxisLabelBottomMargin: 6,
        xAxisLabelBottomMargin: 5
      }
    };

    var presentationProfileChanges = {
      "small": {
        margin: { top: 40, bottom: 65, left: 70 },
        yAxisLabelBottomMargin: 10,
        xAxisLabelBottomMargin: 10
      },
      "medium": {
        margin: { top: 80, bottom: 80, left: 100 },
        yAxisLabelBottomMargin: 20,
        xAxisLabelBottomMargin: 20
      },
      "large": {
        margin: { top: 80, bottom: 100, left: 100 },
        yAxisLabelBottomMargin: 20,
        xAxisLabelBottomMargin: 20
      }
    }

    var _this = this;

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);

    var margin = this.activeProfile.margin;
    var infoElHeight = this.activeProfile.infoElHeight;

    //stage
    this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
    this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

    //            this.collisionResolver.height(this.height);

    //graph group is shifted according to margins (while svg element is at 100 by 100%)
    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.resize(this.width, this.height, Math.min(this.width/2.5, Math.max(this.height / 4, this.width / 4)));
    this.eventArea
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));

    //update scales to the new range
    if(this.model.marker.axis_y.scaleType !== "ordinal") {
      this.yScale.range(this._rangeBump([this.height, 0]));
    } else {
      this.yScale.rangePoints([this.height, 0], _this.activeProfile.padding).range();
    }
    if(this.model.marker.axis_x.scaleType !== "ordinal") {
      this.xScale.range(this._rangeBump([0, this.width]));
    } else {
      this.xScale.rangePoints([0, this.width], _this.activeProfile.padding).range();
    }

    //apply scales to axes and redraw
    this.yAxis.scale(this.yScale)
      .orient("left")
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_y.scaleType,
        toolMargin: margin,
        limitMaxTickNumber: 6,
        bump: this.activeProfile.maxRadius
      });

    this.xAxis.scale(this.xScale)
      .orient("bottom")
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_x.scaleType,
        toolMargin: margin,
        bump: this.activeProfile.maxRadius
      });


    this.bubbleContainerCrop
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));

    this.xAxisElContainer
      .attr("width", this.width + 1)
      .attr("height", this.activeProfile.margin.bottom)
      .attr("y", this.height - 1)
      .attr("x", -1);
    this.xAxisEl
      .attr("transform", "translate(1,1)");

    this.yAxisElContainer
      .attr("width", this.activeProfile.margin.left)
      .attr("height", Math.max(0, this.height))
      .attr("x", -this.activeProfile.margin.left);
    this.yAxisEl
      .attr("transform", "translate(" + (this.activeProfile.margin.left - 1) + "," + 0 + ")");

    this.yAxisEl.call(this.yAxis);
    this.xAxisEl.call(this.xAxis);

    this.projectionX.attr("y1", _this.yScale.range()[0] + this.activeProfile.maxRadius);
    this.projectionY.attr("x2", _this.xScale.range()[0] - this.activeProfile.maxRadius);

    this.dataWarningEl.select("text").text(
      this.translator("hints/dataWarning" + (this.getLayoutProfile() === 'small' ? "-little" : ""))
    )
    var dataWarningWidth = this.dataWarningEl.select("text").node().getBBox().width;

    var yTitleText = this.yTitleEl.select("text").text(this.strings.title.Y + this.strings.unit.Y);
    if(yTitleText.node().getBBox().width > this.width) yTitleText.text(this.strings.title.Y);

    var xTitleText = this.xTitleEl.select("text").text(this.strings.title.X + this.strings.unit.X);
    if(xTitleText.node().getBBox().width > this.width - dataWarningWidth * 2.2) xTitleText.text(this.strings.title.X);



    var sTitleText = this.sTitleEl.select("text")
      .text(this.translator("buttons/size") + ": " + this.strings.title.S + ", " +
        this.translator("buttons/colors") + ": " + this.strings.title.C);

    var probe = this.sTitleEl.append("text").text(sTitleText.text());
    var font = parseInt(probe.style("font-size")) * (this.height - 30) / probe.node().getBBox().width;

    if(probe.node().getBBox().width > this.height - 30) {
      sTitleText.style("font-size", font + "px");
    } else {
      sTitleText.style("font-size", null);
    }
    probe.remove();

    var yaxisWidth = this.yAxisElContainer.select("g").node().getBBox().width;
    this.yTitleEl
      .style("font-size", infoElHeight)
      .attr("transform", "translate(" + (-yaxisWidth) + ", -" + this.activeProfile.yAxisLabelBottomMargin + ")");

    this.xTitleEl
      .style("font-size", infoElHeight)
      .attr("transform", "translate(" + (0) + "," + (this.height + margin.bottom - this.activeProfile.xAxisLabelBottomMargin) + ")");

    this.sTitleEl
      .attr("transform", "translate(" + this.width + "," + 20 + ") rotate(-90)");

    this.dataWarningEl
      .attr("transform", "translate(" + (this.width) + "," + (this.height + margin.bottom - this.activeProfile.xAxisLabelBottomMargin) + ")");

    var warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
      .attr("width", warnBB.height * 0.75)
      .attr("height", warnBB.height * 0.75)
      .attr("x", -warnBB.width - warnBB.height * 1.2)
      .attr("y", - warnBB.height * 0.65);

    if(this.yInfoEl.select('svg').node()) {
      var titleBBox = this.yTitleEl.node().getBBox();
      var translate = d3.transform(this.yTitleEl.attr('transform')).translate;

      this.yInfoEl.select('svg')
        .attr("width", infoElHeight)
        .attr("height", infoElHeight)
      this.yInfoEl.attr('transform', 'translate('
        + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
        + (translate[1] - infoElHeight * 0.8) + ')');
    }

    if(this.xInfoEl.select('svg').node()) {
      var titleBBox = this.xTitleEl.node().getBBox();
      var translate = d3.transform(this.xTitleEl.attr('transform')).translate;

      this.xInfoEl.select('svg')
        .attr("width", infoElHeight)
        .attr("height", infoElHeight)
      this.xInfoEl.attr('transform', 'translate('
        + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
        + (translate[1] - infoElHeight * 0.8) + ')');
   }

  },

  updateMarkerSizeLimits: function() {
    var _this = this;
    var minRadius = this.activeProfile.minRadius;
    var maxRadius = this.activeProfile.maxRadius;

    this.minRadius = Math.max(maxRadius * this.model.marker.size.min, minRadius);
    this.maxRadius = Math.max(maxRadius * this.model.marker.size.max, minRadius);

    if(this.model.marker.size.scaleType !== "ordinal") {
      this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
    } else {
      this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
    }

  },

  redrawDataPointsOnlyColors: function() {
    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.TIMEDIM;

    this.entityBubbles.style("fill", function(d) {
      var pointer = {};
      pointer[KEY] = d[KEY];
      pointer[TIMEDIM] = _this.time;

      var valueC = _this.model.marker.color.getValue(pointer);
      return _this.cScale(valueC);
    });
  },

  redrawDataPointsOnlySize: function() {
    var _this = this;

    // if (this.someSelected) {
    //   _this.entityBubbles.each(function (d, index) {
    //     _this._updateBubble(d, index, d3.select(this), 0);
    //   });
    // } else {
    //   this.entityBubbles.each(function (d, index) {
    //     var valueS = _this.model.marker.size.getValue(d);
    //     if (valueS == null) return;

    //     d3.select(this).attr("r", utils.areaToRadius(_this.sScale(valueS)));
    //   });
    // }
    var values;
    var KEY = this.KEY;
    if(this.model.time.lockNonSelected && this.someSelected) {
      var tLocked = this.timeFormatter.parse("" + this.model.time.lockNonSelected);
      values = this._getValuesInterpolated(tLocked);
    } else {
      values = this._getValuesInterpolated(this.time);
    }

    this.entityBubbles.each(function(d, index) {

      var valueS = values.size[d[KEY]];
      if(valueS == null) return;

      d3.select(this).attr("r", utils.areaToRadius(_this.sScale(valueS)));
    });
  },

  /*
   * REDRAW DATA POINTS:
   * Here plotting happens
   * debouncing to improve performance: events might trigger it more than 1x
   */
  redrawDataPoints: function(duration) {
    var _this = this;

    if(duration == null) duration = _this.duration;

    var TIMEDIM = this.TIMEDIM;
    var KEY = this.KEY;
    var values, valuesLocked;

    //get values for locked and not locked
    if(this.model.time.lockNonSelected && this.someSelected) {
      var tLocked = this.timeFormatter.parse("" + this.model.time.lockNonSelected);
      valuesLocked = this._getValuesInterpolated(tLocked);
    }

    values = this._getValuesInterpolated(this.time);

    this.entityBubbles.each(function(d, index) {
      var view = d3.select(this);
      _this._updateBubble(d, values, valuesLocked, index, view, duration);

    }); // each bubble

    // Call flush() after any zero-duration transitions to synchronously flush the timer queue
    // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
    if(_this.duration == 0) d3.timer.flush();

    if(_this.ui.labels.autoResolveCollisions) {
      // cancel previously queued simulation if we just ordered a new one
      clearTimeout(_this.collisionTimeout);

      // place label layout simulation into a queue
      _this.collisionTimeout = setTimeout(function() {
        //  _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
      }, _this.model.time.delayAnimations * 1.2)
    }

  },

  //redraw Data Points
  _updateBubble: function(d, values, valuesL, index, view, duration) {

    var _this = this;
    var TIMEDIM = this.TIMEDIM;
    var KEY = this.KEY;
    if(_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
      values = valuesL;
    }

    var valueY = values.axis_y[d[KEY]];
    var valueX = values.axis_x[d[KEY]];
    var valueS = values.size[d[KEY]];
    var valueL = values.label[d[KEY]];
    var valueC = values.color[d[KEY]];

    // check if fetching data succeeded
    //TODO: what if values are ACTUALLY 0 ?
    if(!valueL || !valueY || !valueX || !valueS) {
      // if entity is missing data it should hide
      view.classed("vzb-invisible", true)

    } else {

      // if entity has all the data we update the visuals
      var scaledS = utils.areaToRadius(_this.sScale(valueS));

      view.classed("vzb-invisible", false)
        .style("fill", _this.cScale(valueC));


      if(duration) {
        view.transition().duration(duration).ease("linear")
          .attr("cy", _this.yScale(valueY))
          .attr("cx", _this.xScale(valueX))
          .attr("r", scaledS);
      } else {
        view.interrupt()
          .attr("cy", _this.yScale(valueY))
          .attr("cx", _this.xScale(valueX))
          .attr("r", scaledS);
        // fix for #407 & #408
        d3.timer.flush();
      }

      if(this.model.time.record) _this._export.write({
        type: "circle",
        id: d[KEY],
        time: this.model.time.value.getFullYear(),
        fill: _this.cScale(valueC),
        cx: _this.xScale(valueX),
        cy: _this.yScale(valueY),
        r: scaledS
      });

      _this._updateLabel(d, index, valueX, valueY, scaledS, valueL, duration);

    } // data exists
  },


  _updateLabel: function(d, index, valueX, valueY, scaledS, valueL, duration) {
    var _this = this;
    var KEY = this.KEY;
    if(d[KEY] == _this.druging)
      return;

    if(_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};

    var cached = _this.cached[d[KEY]];
    if(duration == null) duration = _this.duration;

    // only for selected entities
    if(_this.model.entities.isSelected(d) && _this.entityLabels != null) {

      var select = utils.find(_this.model.entities.select, function(f) {
        return f[KEY] == d[KEY]
      });
      var trailStartTime = _this.timeFormatter.parse("" + select.trailStartTime);

      if(!_this.model.time.trails || trailStartTime - _this.time > 0 || select.trailStartTime == null) {

        select.trailStartTime = _this.timeFormatter(_this.time);
        //the events in model are not triggered here. to trigger uncomment the next line
        //_this.model.entities.triggerAll("change:select");
        cached.scaledS0 = scaledS;
        cached.labelX0 = valueX;
        cached.labelY0 = valueY;

      }

      var lineGroup = _this.entityLines.filter(function(f) {
        return f[KEY] == d[KEY];
      });
      // reposition label
      _this.entityLabels.filter(function(f) {
          return f[KEY] == d[KEY]
        })
        .each(function(groupData) {

          cached.valueX = valueX;
          cached.valueY = valueY;

          var limitedX, limitedY, limitedX0, limitedY0;
          if(cached.scaledS0 == null || cached.labelX0 == null || cached.labelX0 == null) { //initialize label once
            cached.scaledS0 = scaledS;
            cached.labelX0 = valueX;
            cached.labelY0 = valueY;
          }
          var labelGroup = d3.select(this);

          var text = labelGroup.selectAll(".vzb-bc-label-content")
            .text(valueL + (_this.model.time.trails ? " " + select.trailStartTime : ""));

          lineGroup.select("line").style("stroke-dasharray", "0 " + (cached.scaledS0 + 2) + " 100%");

          var rect = labelGroup.select("rect");

          var contentBBox = text[0][0].getBBox();
          if(!cached.contentBBox || cached.contentBBox.width != contentBBox.width) {
            cached.contentBBox = contentBBox;

            var labelCloseGroup = labelGroup.select(".vzb-bc-label-x")
              .attr("x", /*contentBBox.height * .0 + */ 4)
              .attr("y", contentBBox.height * -1);

            labelCloseGroup.select("circle")
              .attr("cx", /*contentBBox.height * .0 + */ 4)
              .attr("cy", contentBBox.height * -1)
              .attr("r", contentBBox.height * .5);

            labelCloseGroup.select("svg")
              .attr("x", -contentBBox.height * .5 + 4)
              .attr("y", contentBBox.height * -1.5)
              .attr("width", contentBBox.height)
              .attr("height", contentBBox.height)

            rect.attr("width", contentBBox.width + 8)
              .attr("height", contentBBox.height * 1.2)
              .attr("x", -contentBBox.width - 4)
              .attr("y", -contentBBox.height * .85)
              .attr("rx", contentBBox.height * .2)
              .attr("ry", contentBBox.height * .2);
          }

          limitedX0 = _this.xScale(cached.labelX0);
          limitedY0 = _this.yScale(cached.labelY0);

          cached.labelX_ = select.labelOffset[0] || (-cached.scaledS0 * .75 - 5) / _this.width;
          cached.labelY_ = select.labelOffset[1] || (-cached.scaledS0 * .75 - 11) / _this.height;

          limitedX = _this.xScale(cached.labelX0) + cached.labelX_ * _this.width;
          if(limitedX - cached.contentBBox.width <= 0) { //check left
            cached.labelX_ = (cached.scaledS0 * .75 + cached.contentBBox.width + 10) / _this.width;
            limitedX = _this.xScale(cached.labelX0) + cached.labelX_ * _this.width;
          } else if(limitedX + 15 > _this.width) { //check right
            cached.labelX_ = (_this.width - 15 - _this.xScale(cached.labelX0)) / _this.width;
            limitedX = _this.xScale(cached.labelX0) + cached.labelX_ * _this.width;
          }
          limitedY = _this.yScale(cached.labelY0) + cached.labelY_ * _this.height;
          if(limitedY - cached.contentBBox.height <= 0) { // check top
            cached.labelY_ = (cached.scaledS0 * .75 + cached.contentBBox.height) / _this.height;
            limitedY = _this.yScale(cached.labelY0) + cached.labelY_ * _this.height;
          } else if(limitedY + 10 > _this.height) { //check bottom
            cached.labelY_ = (_this.height - 10 - _this.yScale(cached.labelY0)) / _this.height;
            limitedY = _this.yScale(cached.labelY0) + cached.labelY_ * _this.height;
          }

          _this._repositionLabels(d, index, this, limitedX, limitedY, limitedX0, limitedY0, duration, lineGroup);

        })
    } else {
      //for non-selected bubbles
      //make sure there is no cached data
      if(_this.cached[d[KEY]] != null) {
        _this.cached[d[KEY]] = void 0;
      }
    }
  },

  _repositionLabels: function(d, i, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration, lineGroup) {

    var cache = this.cached[d[this.KEY]];

    var labelGroup = d3.select(context);

    var width = parseInt(labelGroup.select("rect").attr("width"));
    var height = parseInt(labelGroup.select("rect").attr("height"));

    if(resolvedX - width <= 0) { //check left
      cache.labelX_ = (width - this.xScale(cache.labelX0)) / this.width;
      resolvedX = this.xScale(cache.labelX0) + cache.labelX_ * this.width;
    } else if(resolvedX + 20 > this.width) { //check right
      cache.labelX_ = (this.width - 20 - this.xScale(cache.labelX0)) / this.width;
      resolvedX = this.xScale(cache.labelX0) + cache.labelX_ * this.width;
    }
    if(resolvedY - height <= 0) { // check top
      cache.labelY_ = (height - this.yScale(cache.labelY0)) / this.height;
      resolvedY = this.yScale(cache.labelY0) + cache.labelY_ * this.height;
    } else if(resolvedY + 13 > this.height) { //check bottom
      cache.labelY_ = (this.height - 13 - this.yScale(cache.labelY0)) / this.height;
      resolvedY = this.yScale(cache.labelY0) + cache.labelY_ * this.height;
    }

    if(duration) {
      labelGroup
        .transition().duration(duration).ease("linear")
        .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
      lineGroup.transition().duration(duration).ease("linear")
        .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
    } else {
      labelGroup.attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
      lineGroup.attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
    }

    var diffX1 = resolvedX0 - resolvedX;
    var diffY1 = resolvedY0 - resolvedY;
    var diffX2 = 0;
    var diffY2 = 0;

    var angle = Math.atan2(diffX1 + width / 2, diffY1 + height / 2) * 180 / Math.PI;
    // middle bottom
    if(Math.abs(angle) <= 45) {
      diffX2 = width / 2;
      diffY2 = 0
    }
    // right middle
    if(angle > 45 && angle < 135) {
      diffX2 = 0;
      diffY2 = height / 4;
    }
    // middle top
    if(angle < -45 && angle > -135) {
      diffX2 = width - 4;
      diffY2 = height / 4;
    }
    // left middle
    if(Math.abs(angle) >= 135) {
      diffX2 = width / 2;
      diffY2 = height / 2
    }

    lineGroup.selectAll("line")
      .attr("x1", diffX1)
      .attr("y1", diffY1)
      .attr("x2", -diffX2)
      .attr("y2", -diffY2);

  },


  selectDataPoints: function() {
    var _this = this;
    var KEY = this.KEY;

    _this.someSelected = (_this.model.entities.select.length > 0);


    this.entityLabels = this.labelsContainer.selectAll('.vzb-bc-entity')
      .data(_this.model.entities.select, function(d) {
        return(d[KEY]);
      });
    this.entityLines = this.linesContainer.selectAll('.vzb-bc-entity')
      .data(_this.model.entities.select, function(d) {
        return(d[KEY]);
      });


    this.entityLabels.exit()
      .each(function(d) {
        _this._trails.run("remove", d);
      })
      .remove();
    this.entityLines.exit()
      .each(function(d) {
        _this._trails.run("remove", d);
      })
      .remove();
    this.entityLines
      .enter().append('g')
      .attr("class", "vzb-bc-entity")
      .each(function(d, index) {
        d3.select(this).append("line").attr("class", "vzb-bc-label-line");
      });

    this.entityLabels
      .enter().append("g")
      .attr("class", "vzb-bc-entity")
      .call(_this.labelDragger)
      .each(function(d, index) {
        var view = d3.select(this);

// Ola: Clicking bubble label should not zoom to countries boundary #811
// It's too easy to accidentally zoom
// This feature will be activated later, by making the label into a "context menu" where users can click Split, or zoom,.. hide others etc....

        view.append("rect");
//          .on("click", function(d, i) {
//            //default prevented is needed to distinguish click from drag
//            if(d3.event.defaultPrevented) return;
//
//            var maxmin = _this.cached[d[KEY]].maxMinValues;
//            var radius = utils.areaToRadius(_this.sScale(maxmin.valueSmax));
//            _this._panZoom._zoomOnRectangle(_this.element,
//              _this.xScale(maxmin.valueXmin) - radius,
//              _this.yScale(maxmin.valueYmin) + radius,
//              _this.xScale(maxmin.valueXmax) + radius,
//              _this.yScale(maxmin.valueYmax) - radius,
//              false, 500);
//          });

        view.append("text").attr("class", "vzb-bc-label-content vzb-label-shadow");

        view.append("text").attr("class", "vzb-bc-label-content");

        var cross = view.append("g").attr("class", "vzb-bc-label-x vzb-transparent");
        utils.setIcon(cross, iconClose);

        cross.insert("circle", "svg");

        cross.select("svg")
          .attr("class", "vzb-bc-label-x-icon")
          .attr("width", "0px")
          .attr("height", "0px");

        cross.on("click", function() {
          _this.model.entities.clearHighlighted();
          //default prevented is needed to distinguish click from drag
          if(d3.event.defaultPrevented) return;
          _this.model.entities.selectEntity(d);
        });

        _this._trails.create(d);
      })
      .on("mouseover", function(d) {
        if(utils.isTouchDevice()) return;
        _this.model.entities.highlightEntity(d);
        d3.select(this).selectAll(".vzb-bc-label-x")
          .classed("vzb-transparent", false);
      })
      .on("mouseout", function(d) {
        if(utils.isTouchDevice()) return;
        _this.model.entities.clearHighlighted();
        d3.select(this).selectAll(".vzb-bc-label-x")
          .classed("vzb-transparent", true);
      });


  },


  _setTooltip: function(tooltipText, x, y, offset) {
    if(tooltipText) {
      var mouse = d3.mouse(this.graph.node()).map(function(d) {
        return parseInt(d)
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

      var contentBBox = this.tooltip.select('text')[0][0].getBBox();
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
        ")")

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

  /*
   * Shows and hides axis projections
   */
  _axisProjections: function(d) {
    if(d != null) {

      var valueY = this.model.marker.axis_y.getValue(d);
      var valueX = this.model.marker.axis_x.getValue(d);
      var valueS = this.model.marker.size.getValue(d);
      var radius = utils.areaToRadius(this.sScale(valueS));

      if(!valueY || !valueX || !valueS) return;

      if(this.ui.whenHovering.showProjectionLineX
        && this.xScale(valueX) > 0 && this.xScale(valueX) < this.width
        && (this.yScale(valueY) + radius) < this.height) {
        this.projectionX
          .style("opacity", 1)
          .attr("y2", this.yScale(valueY) + radius)
          .attr("x1", this.xScale(valueX))
          .attr("x2", this.xScale(valueX));
      }

      if(this.ui.whenHovering.showProjectionLineY
        && this.yScale(valueY) > 0 && this.yScale(valueY) < this.height
        && (this.xScale(valueX) - radius) > 0) {
        this.projectionY
          .style("opacity", 1)
          .attr("y1", this.yScale(valueY))
          .attr("y2", this.yScale(valueY))
          .attr("x1", this.xScale(valueX) - radius);
      }

      if(this.ui.whenHovering.higlightValueX) this.xAxisEl.call(
        this.xAxis.highlightValue(valueX)
      );

      if(this.ui.whenHovering.higlightValueY) this.yAxisEl.call(
        this.yAxis.highlightValue(valueY)
      );

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
  highlightDataPoints: function() {
    var _this = this;
    var TIMEDIM = this.TIMEDIM;
    var KEY = this.KEY;

    this.someHighlighted = (this.model.entities.highlight.length > 0);

    this.updateBubbleOpacity();

    if(this.model.entities.highlight.length === 1) {
      var d = utils.clone(this.model.entities.highlight[0]);

      if(_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
        d[TIMEDIM] = _this.timeFormatter.parse("" + _this.model.time.lockNonSelected);
      } else {
        d[TIMEDIM] = d.trailStartTime || _this.time;
      }

      this._axisProjections(d);
      var selectedData = utils.find(this.model.entities.select, function(f) {
        return f[KEY] == d[KEY];
      });
      if(selectedData) {
        var clonedSelectedData = utils.clone(selectedData);
        //change opacity to OPACITY_HIGHLT = 1.0;
        clonedSelectedData.opacity = 1.0;
        this._trails.run(["opacityHandler"], clonedSelectedData);
      }
    } else {
      this._axisProjections();
      this._trails.run(["opacityHandler"]);      
    }
  },

  updateBubbleOpacity: function(duration) {
    var _this = this;
    //if(!duration)duration = 0;

    var OPACITY_HIGHLT = 1.0;
    var OPACITY_HIGHLT_DIM = .3;
    var OPACITY_SELECT = this.model.entities.opacityRegular;
    var OPACITY_REGULAR = this.model.entities.opacityRegular;
    var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

    this.entityBubbles
      //.transition().duration(duration)
      .style("opacity", function(d) {

        if(_this.someHighlighted) {
          //highlight or non-highlight
          if(_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
        }

        if(_this.someSelected) {
          //selected or non-selected
          return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
        }

        if(_this.someHighlighted) return OPACITY_HIGHLT_DIM;

        return OPACITY_REGULAR;
      });


    var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < .01;

    // when pointer events need update...
    if(someSelectedAndOpacityZero != this.someSelectedAndOpacityZero_1) {
      this.entityBubbles.style("pointer-events", function(d) {
        return(!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
          "visible" : "none";
      });
    }

    this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < .01;
  },

  /*
   * Calculates all values for this data configuration
   */
  _calculateAllValues: function() {
    this.STEPS = this.model.time.getAllSteps();
    this.VALUES = {};
    var f = {};
    for(var i = 0; i < this.STEPS.length; i++) {
      var t = this.STEPS[i];
      f[this.TIMEDIM] = t;
      this.VALUES[t] = this.model.marker.getValues(f, [this.KEY]);
    }
  },

  /*
   * Gets all values for any point in time
   * @param {Date} t time value
   */
  _getValuesInterpolated: function(t) {

    if(!this.VALUES) this._calculateAllValues();
    if(this.VALUES[t]) return this.VALUES[t];

    var next = d3.bisectLeft(this.STEPS, t);

    //if first
    if(next === 0) {
      return this.VALUES[this.STEPS[0]];
    }
    if(next > this.STEPS.length) {
      return this.VALUES[this.STEPS[this.STEPS.length - 1]];
    }

    var fraction = (t - this.STEPS[next - 1]) / (this.STEPS[next] - this.STEPS[next - 1]);

    var pValues = this.VALUES[this.STEPS[next - 1]];
    var nValues = this.VALUES[this.STEPS[next]];

    var curr = {};
    utils.forEach(pValues, function(values, hook) {
      curr[hook] = {};
      utils.forEach(values, function(val, id) {
        var val2 = nValues[hook][id];
        curr[hook][id] = (!utils.isNumber(val)) ? val : val + ((val2 - val) * fraction);
      });
    });

    return curr;
  }

});

export default BubbleChartComp;
