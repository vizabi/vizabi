import * as utils from 'base/utils';
import Component from 'base/component';
import Trail from './bubblechart-trail';
import PanZoom from './bubblechart-panzoom';
import Exporter from 'helpers/svgexport';
import axisSmart from 'helpers/d3.axisWithLabelPicker';
import DynamicBackground from 'helpers/d3.dynamicBackground';

import {
  warn as iconWarn,
  question as iconQuestion
} from 'base/iconset';



//BUBBLE CHART COMPONENT
var BubbleChartComp = Component.extend({

  /**
   * Initializes the component (Bubble Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
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

    this.model_binds = {
      'change:time.start': function(evt, original) {
        if(_this.model.marker.color.scaleType === 'time') {
          _this.model.marker.color.scale = null;
        }
      },
      "change:time.record": function() {
        //console.log("change time record");
        if(_this.model.time.record) {
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
        if(!_this._readyOnce) return;

        if(path.indexOf("scaleType") > -1) {
          _this.ready();
          return;
        }

        if(path.indexOf("marker.size") !== -1) return;
        if(path.indexOf("marker.size_label") !== -1) return;

        if(path.indexOf("domainMin") > -1 || path.indexOf("domainMax") > -1) {
          _this.updateSize();
          _this.updateMarkerSizeLimits();
          _this._trails.run("findVisible");
          _this.redrawDataPoints();
          _this._trails.run("resize");
          return;
        }
        if(path.indexOf("zoomedMin") > -1 || path.indexOf("zoomedMax") > -1) {
          if(_this.draggingNow)return;

          //avoid zooming again if values didn't change.
          //also prevents infinite loop on forced URL update from zoom.stop()
          if(_this._zoomedXYMinMax.axis_x.zoomedMin == _this.model.marker.axis_x.zoomedMin
          && _this._zoomedXYMinMax.axis_x.zoomedMax == _this.model.marker.axis_x.zoomedMax
          && _this._zoomedXYMinMax.axis_y.zoomedMin == _this.model.marker.axis_y.zoomedMin
          && _this._zoomedXYMinMax.axis_y.zoomedMax == _this.model.marker.axis_y.zoomedMax
          ) return;

            _this._panZoom.zoomToMaxMin(
              _this.model.marker.axis_x.zoomedMin,
              _this.model.marker.axis_x.zoomedMax,
              _this.model.marker.axis_y.zoomedMin,
              _this.model.marker.axis_y.zoomedMax,
              500
          )
          return;
        }

        //console.log("EVENT change:marker", evt);
      },
      "change:entities.select": function() {
        if(!_this._readyOnce || !_this.entityBubbles) return;
        //console.log("EVENT change:entities:select");
        _this.selectDataPoints();
        _this.redrawDataPoints();
        _this._trails.create();
        _this._trails.run(["resize", "recolor", "opacityHandler","findVisible", "reveal"]);
        _this.updateBubbleOpacity();
        _this._updateDoubtOpacity();
      },
      "change:entities.highlight": function() {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:entities:highlight");
        _this.highlightDataPoints();
      },
      'change:time.value': function() {
        if (!_this._readyOnce) return;
        if (!_this.calculationQueue) { // collect timestamp that we request
          _this.calculationQueue = [_this.model.time.value.toString()]
        } else {
          _this.calculationQueue.push(_this.model.time.value.toString());
        }
        (function(time) { // isolate timestamp
        //_this._bubblesInteract().mouseout();
          _this.model.marker.getFrame(time, function(frame, time) {
            if (!_this._frameIsValid(frame)) return;
            var index = _this.calculationQueue.indexOf(time.toString()); //
            if (index == -1) { // we was receive more recent frame before so we pass this frame
              return;
            } else {
              _this.calculationQueue.splice(0, index + 1); // remove timestamps that added to queue before current timestamp
            }
            _this.frameChanged(frame, time);
          });

        }(_this.model.time.value));
      },
      'change:ui.adaptMinMaxZoom': function() {
        //console.log("EVENT change:ui:adaptMinMaxZoom");
        if(_this.model.ui.adaptMinMaxZoom) {
          _this._panZoom.expandCanvas(500);
        } else {
          _this._panZoom.reset();
        }
      },
      'change:marker.size.extent': function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        _this.updateMarkerSizeLimits();
        _this._trails.run("findVisible");
        _this.redrawDataPointsOnlySize();
        _this._trails.run("resize");
      },
      'change:marker.color.palette': function(evt, path) {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:marker:color:palette");
        _this.redrawDataPointsOnlyColors();
        _this._trails.run("recolor");
      },
      'change:entities.opacitySelectDim': function() {
        _this.updateBubbleOpacity();
      },
      'change:entities.opacityRegular': function() {
        _this.updateBubbleOpacity();
        _this._trails.run("opacityHandler");
      },
      'change:ui.cursorMode': function() {
        var svg = _this.element.select("svg");
        if(_this.model.ui.cursorMode === "plus"){
            svg.classed("vzb-zoomin", true);
            svg.classed("vzb-zoomout", false);
        }else if(_this.model.ui.cursorMode === "minus"){
            svg.classed("vzb-zoomin", false);
            svg.classed("vzb-zoomout", true);
        }else{
            svg.classed("vzb-zoomin", false);
            svg.classed("vzb-zoomout", false);
        }
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

  },
  
  afterPreload: function() {
    var _this = this;
    this.labels = this.parent.findChildByName('gapminder-labels');
    this.labels.config({
      CSS_PREFIX: 'vzb-bc',
      TOOL_CONTEXT: this,
      LABELS_CONTAINER_CLASS: 'vzb-bc-labels',
      LINES_CONTAINER_CLASS: 'vzb-bc-lines'
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
    this._readyOnce = false;
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
    this.labelsContainerCrop = this.graph.select('.vzb-bc-labels-crop');
    this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
    this.labelsContainer = this.graph.select('.vzb-bc-labels');
    this.linesContainer = this.graph.select('.vzb-bc-lines');
    this.zoomRect = this.element.select('.vzb-bc-zoom-rect');
    this.eventArea = this.element.select('.vzb-bc-eventarea');
    
    this.entityBubbles = null;
    this.tooltip = this.element.select('.vzb-bc-tooltip');
    this.tooltipMobile = this.element.select('.vzb-tooltip-mobile');
    //component events
    this.on("resize", function() {
      //console.log("EVENT: resize");
      //return if updatesize exists with error
      if(_this.updateSize()) return;
      _this.updateMarkerSizeLimits();
      _this.labels.updateSize();
      _this._trails.run("findVisible");
      _this._panZoom.rerun(); // includes redraw data points and trail resize
    });

    //keyboard listeners
    d3.select("body")
      .on("keydown", function() {
        if(_this.model.ui.cursorMode !== 'arrow') return;
        if(d3.event.metaKey || d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", true);
      })
      .on("keyup", function() {
        if(_this.model.ui.cursorMode !== 'arrow') return;
        if(!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
      });
        
    this.root.on('resetZoom', function(){
        _this._panZoom.reset(null, 500);
    });

    this.bubbleContainerCrop
      .call(this._panZoom.zoomer)
      .call(this._panZoom.dragRectangle)
      .on('dblclick.zoom', null)
      .on("mouseup", function() {
        _this.draggingNow = false;
      })
      .on("click", function() {
        var cursor = _this.model.ui.cursorMode;
        if (!d3.event.defaultPrevented && cursor!=="arrow") {
          _this._panZoom.zoomByIncrement(cursor, 500);
        }
      });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.updateUIStrings();

    this.wScale = d3.scale.linear()
      .domain(this.parent.datawarning_content.doubtDomain)
      .range(this.parent.datawarning_content.doubtRange);
    _this._readyOnce = true;
  },
  
  _frameIsValid: function(frame) {
    return !(!frame
    || Object.keys(frame.axis_y).length === 0
    || Object.keys(frame.axis_x).length === 0
    || Object.keys(frame.size).length === 0);
  },
  
  ready: function() {
    var _this = this;
    this.updateUIStrings();
    var endTime = this.model.time.end;
    this.model.marker.getFrame(this.model.time.value, function(frame, time) {
      // TODO: temporary fix for case when after data loading time changed on validation
        if (time.toString() != _this.model.time.value.toString()) {  
          utils.defer(function() {
            _this.ready();
          });
          return;
        } 
        if (!_this._frameIsValid(frame)) return;

      _this.frame = frame;
      _this.updateTime();
      _this.updateIndicators();
      _this.updateSize();
      _this.updateEntities();
      _this.redrawDataPoints();
      _this.selectDataPoints();
      _this._trails.create();
      _this.updateMarkerSizeLimits();
      _this.updateBubbleOpacity();
      _this.zoomToMarkerMaxMin(); // includes redraw data points and trail resize
      _this._trails.run(["recolor", "opacityHandler", "findVisible", "reveal"]);
      if(_this.model.ui.adaptMinMaxZoom) _this._panZoom.expandCanvas();
    });
  },

    /*
     * Zoom to the min and max values given in the URL axes markers.
     */
    zoomToMarkerMaxMin: function() {
        /*
         * Reset just the zoom values without triggering a zoom event. This ensures
         * a clean zoom state for the subsequent zoom event.
         */
        this._panZoom.resetZoomState()

        var xAxis = this.model.marker.axis_x;
        var yAxis = this.model.marker.axis_y;

        var xDomain = xAxis.getScale().domain();
        var yDomain = yAxis.getScale().domain();

        /*
         * The axes may return null when there is no value given for the zoomed
         * min and max values. In that case, fall back to the axes' domain values.
         */
        var zoomedMinX = xAxis.zoomedMin ? xAxis.zoomedMin : xDomain[0];
        var zoomedMaxX = xAxis.zoomedMax ? xAxis.zoomedMax : xDomain[1];
        var zoomedMinY = yAxis.zoomedMin ? yAxis.zoomedMin : yDomain[0];
        var zoomedMaxY = yAxis.zoomedMax ? yAxis.zoomedMax : yDomain[1];

        this._panZoom.zoomToMaxMin(zoomedMinX, zoomedMaxX, zoomedMinY, zoomedMaxY);
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
    this.labels.setScales(this.xScale, this.yScale);

    this.yAxis.tickFormat(_this.model.marker.axis_y.getTickFormatter());
    this.xAxis.tickFormat(_this.model.marker.axis_x.getTickFormatter());
  },

  frameChanged: function(frame, time) {
//    if (time.toString() != this.model.time.value.toString()) return; // frame is outdated
    this.frame = frame;
    this.updateTime();
    this._updateDoubtOpacity();
    this._trails.run("findVisible");
    if(this.model.ui.adaptMinMaxZoom) {
      this._panZoom.expandCanvas();
    } else {
      this.redrawDataPoints();
    }
    this._trails.run("reveal");
    this.tooltipMobile.classed('vzb-hidden', true);
  },

  updateUIStrings: function() {
    var _this = this;

    this.translator = this.model.language.getTFunction();

    this.strings = {
      title: {
        Y: this.translator("indicator/" + this.model.marker.axis_y.which),
        X: this.translator("indicator/" + this.model.marker.axis_x.which),
        S: this.translator("indicator/" + this.model.marker.size.which),
        C: this.translator("indicator/" + this.model.marker.color.which)
      },
      unit: {
        Y: this.translator("unit/" + this.model.marker.axis_y.which),
        X: this.translator("unit/" + this.model.marker.axis_x.which),
        S: this.translator("unit/" + this.model.marker.size.which),
        C: this.translator("unit/" + this.model.marker.color.which)
      }
    }
    
    //suppress unit strings that found no translation (returns same thing as requested)
    if(this.strings.unit.Y === "unit/" + this.model.marker.axis_y.which) this.strings.unit.Y = "";
    if(this.strings.unit.X === "unit/" + this.model.marker.axis_x.which) this.strings.unit.X = "";
    if(this.strings.unit.S === "unit/" + this.model.marker.size.which) this.strings.unit.S = "";
    if(this.strings.unit.C === "unit/" + this.model.marker.color.which) this.strings.unit.C = "";
    
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
      _this.parent.findChildByName("gapminder-datanotes").pin();
    })
    this.yInfoEl.on("mouseover", function() {
      var rect = this.getBBox();
      var coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      _this.parent.findChildByName("gapminder-datanotes").setHook('axis_y').show().setPos(coord.x, coord.y);
    })
    this.yInfoEl.on("mouseout", function() {
      _this.parent.findChildByName("gapminder-datanotes").hide();
    })
    this.xInfoEl.on("click", function() {
      _this.parent.findChildByName("gapminder-datanotes").pin();
    })
    this.xInfoEl.on("mouseover", function() {
      if (_this.model.time.dragging) return;
      var rect = this.getBBox();
      var coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      _this.parent.findChildByName("gapminder-datanotes").setHook('axis_x').show().setPos(coord.x, coord.y);
    })
    this.xInfoEl.on("mouseout", function() {
       if (_this.model.time.dragging) return;
      _this.parent.findChildByName("gapminder-datanotes").hide();
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
    if(opacity == null) opacity = this.wScale(+this.model.time.timeFormat(this.time));
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
      return _this.model.marker.getKeys()
        .map(function(d) {
          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer[TIMEDIM] = endTime;
          pointer.sortValue = _this.frame.size[d[KEY]]||0;
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
    this.model.entities.setVisible(getKeys.call(this));
      
    //unselecting bubbles with no data is used for the scenario when
    //some bubbles are selected and user would switch indicator.
    //bubbles would disappear but selection would stay
    if (!this.model.time.splash) {
      this.unselectBubblesWithNoData();
    }

    this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
      .data(this.model.entities.getVisible(), function(d) {return d && !d['trailStartTime'] ? d[KEY] : null}); // trails have not keys

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles.enter().append("circle")
      .attr("class", function(d) {
        return "vzb-bc-entity " + "bubble-" + d[KEY];
      })
      .on("mouseover", function(d, i) {
        if(utils.isTouchDevice() || _this.model.ui.cursorMode !== 'arrow') return;
        _this._bubblesInteract().mouseover(d, i);
      })
      .on("mouseout", function(d, i) {
        if(utils.isTouchDevice() || _this.model.ui.cursorMode !== 'arrow') return;

        _this._bubblesInteract().mouseout(d, i);
      })
      .on("click", function(d, i) {
        if(utils.isTouchDevice() || _this.model.ui.cursorMode !== 'arrow') return;

        _this._bubblesInteract().click(d, i);
      })
      .onTap(function(d, i) {
        d3.event.stopPropagation();
        _this._bubblesInteract().click(d, i);
      })
      .onLongTap(function(d, i) {});

      this.entityBubbles.order();
  },
    
  unselectBubblesWithNoData: function(frame){
      var _this = this;
      var KEY = this.KEY;
      if(!frame) frame = this.frame;
      
      if(!frame || !frame.axis_y || !frame.axis_x || !frame.size) return;
      
      this.model.entities.select.forEach(function(d){
        if(!frame.axis_y[d[KEY]] && frame.axis_y[d[KEY]] !== 0
        || !frame.axis_x[d[KEY]] && frame.axis_x[d[KEY]] !== 0
        || !frame.size[d[KEY]] && frame.size[d[KEY]] !== 0) 
            _this.model.entities.selectEntity(d);
      })
  },

  _bubblesInteract: function() {
    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.TIMEDIM;

    return {
      mouseover: function(d, i) {
        _this.model.entities.highlightEntity(d);

        _this.labels.showCloseCross(d, true);
      },

      mouseout: function(d, i) {
        _this.model.entities.clearHighlighted();

        _this.labels.showCloseCross(d, false);
      },

      click: function(d, i) {
        if(_this.draggingNow) return;
        var isSelected = _this.model.entities.isSelected(d);
        _this.model.entities.selectEntity(d);
        //return to highlighted state
        if(!utils.isTouchDevice() && isSelected) {
            _this.model.entities.highlightEntity(d);
            _this.highlightDataPoints();
        }
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
    if(this.duration) {
      var time = _this.time;
      this.yearDelayId = utils.delay(function() {
        _this.year.setText(_this.model.time.timeFormat(time));
      }, this.duration);
    } else {
      if(this.yearDelayId) {
        utils.clearDelay(this.yearDelayId);
        this.yearDelayId = null;
      }
      _this.year.setText(_this.model.time.timeFormat(_this.time));
    }
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  updateSize: function() {


    var profiles = {
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

    var presentationProfileChanges = {
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
    }

    var _this = this;

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);
    var margin = this.activeProfile.margin;
    var infoElHeight = this.activeProfile.infoElHeight;
    
    //labels
    _this.labels.setCloseCrossHeight(_this.activeProfile.infoElHeight * 1.2);

    //stage
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;
      
    if(this.height<=0 || this.width<=0) return utils.warn("Bubble chart updateSize() abort: vizabi container is too little or has display:none");

    //graph group is shifted according to margins (while svg element is at 100 by 100%)
    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.resize(this.width, this.height, Math.min(this.width/2.5, Math.max(this.height / 3, this.width / 3)));
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
        bump: this.activeProfile.maxRadius,
        constantRakeLength: this.height,
        formatter: this.model.marker.axis_y.getTickFormatter()
      });

    this.xAxis.scale(this.xScale)
      .orient("bottom")
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_x.scaleType,
        toolMargin: margin,
        bump: this.activeProfile.maxRadius,
        constantRakeLength: this.width,
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



    // reduce font size if the caption doesn't fit
    this._updateSTitle();


    var yaxisWidth = this.yAxisElContainer.select("g").node().getBBox().width;
    this.yTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + (-yaxisWidth) + ", -" + this.activeProfile.yAxisTitleBottomMargin + ")");

    this.xTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + (0) + "," + (this.height + margin.bottom - this.activeProfile.xAxisTitleBottomMargin) + ")");

    this.sTitleEl
      .attr("transform", "translate(" + this.width + "," + 20 + ") rotate(-90)");


    var yTitleText = this.yTitleEl.select("text").text(this.strings.title.Y + this.strings.unit.Y);
    if(yTitleText.node().getBBox().width > this.width) yTitleText.text(this.strings.title.Y);

    var xTitleText = this.xTitleEl.select("text").text(this.strings.title.X + this.strings.unit.X);
    if(xTitleText.node().getBBox().width > this.width - 100) xTitleText.text(this.strings.title.X);

    if(this.yInfoEl.select('svg').node()) {
      var titleBBox = this.yTitleEl.node().getBBox();
      var translate = d3.transform(this.yTitleEl.attr('transform')).translate;

      this.yInfoEl.select('svg')
        .attr("width", infoElHeight + "px")
        .attr("height", infoElHeight + "px")
      this.yInfoEl.attr('transform', 'translate('
        + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
        + (translate[1] - infoElHeight * 0.8) + ')');
    }

    if(this.xInfoEl.select('svg').node()) {
      var titleBBox = this.xTitleEl.node().getBBox();
      var translate = d3.transform(this.xTitleEl.attr('transform')).translate;

      this.xInfoEl.select('svg')
        .attr("width", infoElHeight + "px")
        .attr("height", infoElHeight + "px")
      this.xInfoEl.attr('transform', 'translate('
        + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
        + (translate[1] - infoElHeight * 0.8) + ')');
    }

    this._resizeDataWarning();
  },

  _resizeDataWarning: function(){
    this.dataWarningEl
      .attr("transform", "translate("
        + (this.width) + ","
        + (this.height + this.activeProfile.margin.bottom - this.activeProfile.xAxisTitleBottomMargin)
        + ")");

    // reset font size to remove jumpy measurement
    var dataWarningText = this.dataWarningEl.select("text").style("font-size", null);

    // reduce font size if the caption doesn't fit
    var dataWarningWidth = dataWarningText.node().getBBox().width + dataWarningText.node().getBBox().height * 3;
    var remainingWidth = this.width - this.xTitleEl.node().getBBox().width - this.activeProfile.infoElHeight;
    var font = parseInt(dataWarningText.style("font-size")) * remainingWidth / dataWarningWidth;
    dataWarningText.style("font-size", dataWarningWidth > remainingWidth? font + "px" : null);

    // position the warning icon
    var warnBB = dataWarningText.node().getBBox();
    this.dataWarningEl.select("svg")
      .attr("width", warnBB.height * 0.75)
      .attr("height", warnBB.height * 0.75)
      .attr("x", -warnBB.width - warnBB.height * 1.2)
      .attr("y", - warnBB.height * 0.65);
  },

  updateMarkerSizeLimits: function() {
    var _this = this;
    var extent = this.model.marker.size.extent || [0,1];
      
    if(!this.activeProfile) return utils.warn("updateMarkerSizeLimits() is called before ready(). This can happen if events get unfrozen and getFrame() still didn't return data");
      
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

  redrawDataPointsOnlyColors: function() {
    var _this = this;
    var KEY = this.KEY;

    var values = _this.frame;
    var time = this.model.time.value;
    if(this.model.ui.chart.lockNonSelected && this.someSelected) {
      time = this.model.time.timeFormat.parse("" + this.model.ui.chart.lockNonSelected);
    }
    this.model.marker.getFrame(time, function(valuesNow) {
      _this.entityBubbles.style("fill", function(d) {

      var valueC = _this.model.entities.isSelected(d) && _this.model.ui.chart.lockNonSelected ? valuesNow.color[d[KEY]] : values.color[d[KEY]];

      return valueC!=null?_this.cScale(valueC):_this.COLOR_WHITEISH;
      });
    });

  },

  redrawDataPointsOnlySize: function() {
    var _this = this;

    var values, valuesNow;
    var KEY = this.KEY;


    var time = this.model.time.value;

    if(this.model.ui.chart.lockNonSelected && this.someSelected) {
      time = this.model.time.timeFormat.parse("" + this.model.ui.chart.lockNonSelected);
    }
    this.model.marker.getFrame(time, function(valuesLocked) {
      if(!_this._frameIsValid(valuesLocked)) return utils.warn("redrawDataPointsOnlySize: empty data received from marker.getFrames(). doing nothing");

      valuesNow = _this.frame;
      _this.entityBubbles.each(function(d, index) {

      var selected = _this.model.entities.isSelected(d);

      var valueS = selected && _this.model.ui.chart.lockNonSelected ? valuesNow.size[d[KEY]] : valuesLocked.size[d[KEY]];
      if(valueS == null) return;

      var scaledS = utils.areaToRadius(_this.sScale(valueS));
      d3.select(this).attr("r", scaledS);

      //update lines of labels
      if(selected) {

        var select = utils.find(_this.model.entities.select, function(f) {
          return f[KEY] == d[KEY]
        });

        var trailStartTime = _this.model.time.timeFormat.parse("" + select.trailStartTime);

        _this.model.marker.getFrame(trailStartTime, function(valuesTrailStart) {
          if(!valuesTrailStart) return utils.warn("redrawDataPointsOnlySize: empty data received from marker.getFrames(). doing nothing");
          
          var cache = {};
          if(!_this.model.ui.chart.trails || trailStartTime - _this.time == 0) {
            cache.scaledS0 = scaledS;
          } else {
            cache.scaledS0 = utils.areaToRadius(_this.sScale(valuesTrailStart.size[d[KEY]]));
          }
          
          _this.labels.updateLabelOnlyPosition(d, index, cache);

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
  redrawDataPoints: function(duration) {
    var _this = this;
    var KEY = this.KEY;
    if(duration == null) duration = _this.duration;

    if(this.model.ui.chart.lockNonSelected && this.someSelected) {
        var time = this.model.time.timeFormat.parse("" + this.model.ui.chart.lockNonSelected);

        //get values for locked frames
        this.model.marker.getFrame(time, function(lockedFrame) {
            if(!lockedFrame) return utils.warn("redrawDataPoints: empty data received from marker.getFrames(). doing nothing");

            // each bubble
            _this.entityBubbles.each(function(d, index) {
                var frame = _this.model.entities.isSelected(d) ? _this.frame : lockedFrame
                _this._updateBubble(d, frame, index, d3.select(this), duration);
            });
        });
    } else {
        // each bubble
        _this.entityBubbles.each(function(d, index) {
            _this._updateBubble(d, _this.frame, index, d3.select(this), duration);
        });
    }
  },

  //redraw Data Points
  _updateBubble: function(d, values, index, view, duration) {
    var _this = this;
    var KEY = this.KEY;

    var showhide = false;

    var valueY = values.axis_y[d[KEY]];
    var valueX = values.axis_x[d[KEY]];
    var valueS = values.size[d[KEY]];
    var valueL = values.label[d[KEY]];
    var valueC = values.color[d[KEY]];
    var valueLST = values.size_label[d[KEY]];

    // check if fetching data succeeded
    if(!valueL && valueL!==0 || !valueY && valueY!==0 || !valueX && valueX!==0 || !valueS && valueS!==0) {
      // if entity is missing data it should hide
       if(!d.hidden) {
           d.hidden = true;
           showhide = true;
       }
        
       if(showhide) {
           if(duration) {
               var opacity = view.style("opacity");
               view.transition().duration(duration).ease("exp")
                .style("opacity", 0)
                .each("end", function() {
                    //to avoid transition from null state add class with a delay
                    view.classed("vzb-invisible", d.hidden);
                    view.style("opacity", opacity);
                })
           }else{
               //immediately hide the bubble
               view.classed("vzb-invisible", d.hidden);
           }
       }
    } else {
        if(d.hidden || view.classed("vzb-invisible")) {
           d.hidden = false;
           showhide = true;
       }


      // if entity has all the data we update the visuals
      var scaledS = utils.areaToRadius(_this.sScale(valueS));

      view.style("fill", valueC!=null?_this.cScale(valueC):_this.COLOR_WHITEISH);

      if(duration) {
        if(showhide) {
            var opacity = view.style("opacity");
            view.classed("vzb-invisible", d.hidden);
            view.style("opacity", 0)
                .attr("cy", _this.yScale(valueY))
                .attr("cx", _this.xScale(valueX))
                .attr("r", scaledS)
                .transition().duration(duration).ease("exp")
                .style("opacity", opacity);
        }else{
            view.transition().duration(duration).ease("linear")
                .attr("cy", _this.yScale(valueY))
                .attr("cx", _this.xScale(valueX))
                .attr("r", scaledS);
        }

      } else {

        //interrupt the ongoing transition and immediately do the visual updates
        view.interrupt()
          .attr("cy", _this.yScale(valueY))
          .attr("cx", _this.xScale(valueX))
          .attr("r", scaledS);

        //show entity if it was hidden
        if(showhide) view.classed("vzb-invisible", d.hidden);
      }

      if(this.model.time.record) _this._export.write({
        type: "circle",
        id: d[KEY],
        time: this.model.time.value.getUTCFullYear(),
        fill: valueC!=null?_this.cScale(valueC):_this.COLOR_WHITEISH,
        cx: _this.xScale(valueX),
        cy: _this.yScale(valueY),
        r: scaledS
      });

    } // data exists

    _this._updateLabel(d, index, valueX, valueY, valueS, valueL, valueLST, duration, showhide);
  },

  _updateLabel: function(d, index, valueX, valueY, valueS, valueL, valueLST, duration, showhide) {
    var _this = this;
    var KEY = this.KEY;

    // only for selected entities
    if(_this.model.entities.isSelected(d)) {
      
      var cache = null;

      var select = utils.find(_this.model.entities.select, function(f) {
        return f[KEY] == d[KEY]
      });

      var time = _this.model.time.timeFormat(_this.time);
      if(!this.model.ui.chart.trails || select.trailStartTime == time || select.trailStartTime == null) {
        if(select.trailStartTime == null) select.trailStartTime = time; // need only when trailStartTime == null

        var cache = {};
        cache.labelX0 = valueX;
        cache.labelY0 = valueY;
        cache.scaledS0 = valueS ? utils.areaToRadius(_this.sScale(valueS)) : null;
      }

      var trailStartTime = _this.model.time.timeFormat.parse("" + select.trailStartTime);

      var labelText = valueL + (_this.model.ui.chart.trails ? " " + select.trailStartTime : "");

      if(showhide && d.hidden && _this.model.ui.chart.trails && trailStartTime && (trailStartTime < _this.time)) showhide = false;
      if(d.hidden && !_this.model.ui.chart.trails) showhide = true;

      this.labels.updateLabel(d, index, cache, valueX, valueY, valueS, labelText, valueLST, duration, showhide);

    }
  },

  _updateSTitle: function(titleS, titleC) {

    // vertical text about size and color
    if (this.activeProfile.hideSTitle) {
      this.sTitleEl.classed("vzb-invisible", true);
      return;
    }
    if (this.sTitleEl.classed("vzb-invisible")) {
      this.sTitleEl.classed("vzb-invisible", false);
    }
    var sTitleContentON = this.model.marker.size.use !== "constant";
    var cTitleContentON = this.model.marker.color.use !== "constant";
    var sTitleText = this.sTitleEl.select("text")
      // reset font size to remove jumpy measurement
      .style("font-size", null)
      .text(
      (sTitleContentON ? this.translator("buttons/size") + ": " + (titleS ? titleS : this.strings.title.S) : "") +
      (sTitleContentON && cTitleContentON ? ", " : "") +
      (cTitleContentON ? this.translator("buttons/colors") + ": " + (titleC ? titleC : this.strings.title.C) : "")
    );
    var sTitleWidth = sTitleText.node().getBBox().width;
    var remainigHeight = this.height - 30;
    var font = parseInt(sTitleText.style("font-size")) * remainigHeight / sTitleWidth;
    sTitleText.style("font-size", sTitleWidth > remainigHeight? font + "px" : null);
  },
  
  selectDataPoints: function() {
    var _this = this;
    var KEY = this.KEY;

    //hide tooltip
    _this._setTooltip();

    _this.someSelected = (_this.model.entities.select.length > 0);

  },


  _setTooltip: function(tooltipText, x, y, offset) {
    if(tooltipText) {
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
      this.tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")")

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
    var _this = this;
    var TIMEDIM = this.TIMEDIM;
    var KEY = this.KEY;

    if(d != null) {

      this.model.marker.getFrame(d[TIMEDIM], function(values) {
        var valueY = values.axis_y[d[KEY]];
        var valueX = values.axis_x[d[KEY]];
        var valueS = values.size[d[KEY]];
        var radius = utils.areaToRadius(_this.sScale(valueS));

        if(!valueY || !valueX || !valueS) return;

        if(_this.ui.chart.whenHovering.showProjectionLineX
          && _this.xScale(valueX) > 0 && _this.xScale(valueX) < _this.width
          && (_this.yScale(valueY) + radius) < _this.height) {
          _this.projectionX
            .style("opacity", 1)
            .attr("y2", _this.yScale(valueY) + radius)
            .attr("x1", _this.xScale(valueX))
            .attr("x2", _this.xScale(valueX));
        }

        if(_this.ui.chart.whenHovering.showProjectionLineY
          && _this.yScale(valueY) > 0 && _this.yScale(valueY) < _this.height
          && (_this.xScale(valueX) - radius) > 0) {
          _this.projectionY
            .style("opacity", 1)
            .attr("y1", _this.yScale(valueY))
            .attr("y2", _this.yScale(valueY))
            .attr("x1", _this.xScale(valueX) - radius);
        }

        if(_this.ui.chart.whenHovering.higlightValueX) _this.xAxisEl.call(
          _this.xAxis.highlightValue(valueX)
        );

        if(_this.ui.chart.whenHovering.higlightValueY) _this.yAxisEl.call(
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
  highlightDataPoints: function() {
    var _this = this;
    var TIMEDIM = this.TIMEDIM;
    var KEY = this.KEY;

    this.someHighlighted = (this.model.entities.highlight.length > 0);

    this.updateBubbleOpacity();

    if(this.model.entities.highlight.length === 1) {
      var d = utils.clone(this.model.entities.highlight[0]);

      if(_this.model.ui.chart.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
        d[TIMEDIM] = _this.model.time.timeFormat.parse("" + _this.model.ui.chart.lockNonSelected);
      } else {
        d[TIMEDIM] = _this.model.time.timeFormat.parse("" + d.trailStartTime) || _this.time;
      }

      _this.model.marker.getFrame(d[TIMEDIM], function(values) {
          var x = _this.xScale(values.axis_x[d[KEY]]);
          var y = _this.yScale(values.axis_y[d[KEY]]);
          var s = utils.areaToRadius(_this.sScale(values.size[d[KEY]]));
          var entityOutOfView = false;

          var unitY = _this.translator("unit/" + _this.model.marker.size.which);
          var unitC = _this.translator("unit/" + _this.model.marker.color.which);
  
          //suppress unit strings that found no translation (returns same thing as requested)
          if(unitY === "unit/" + _this.model.marker.size.which) unitY = "";
          if(unitC === "unit/" + _this.model.marker.color.which) unitC = "";
        
          var formatterS = _this.model.marker.size.getTickFormatter();
          var formatterC = _this.model.marker.color.getTickFormatter();
          _this._updateSTitle(
            formatterS(values.size[d[KEY]])  + " " + unitY,
            values.color[d[KEY]] || values.color[d[KEY]]===0 ? formatterC(values.color[d[KEY]]) + " " + unitC : _this.translator("hints/nodata")
          );
          if(x + s < 0 || x - s > _this.width || y + s < 0 || y - s > _this.height) {
            entityOutOfView = true;
          }
          
          //show tooltip
          var text = "";
          var hoverTrail = false;
          if(_this.model.entities.isSelected(d) && _this.model.ui.chart.trails) {
            text = _this.model.time.timeFormat(_this.time);
            var selectedData = utils.find(_this.model.entities.select, function(f) {
              return f[KEY] == d[KEY]
            });
            _this.labels.highlight(d, true);
            hoverTrail = text !== selectedData.trailStartTime && !d3.select(d3.event.target).classed('bubble-' + d[KEY]);
            text = text !== selectedData.trailStartTime && _this.time === d[TIMEDIM] ? text : '';
          } else {
            text = _this.model.entities.isSelected(d) ? '': values.label[d[KEY]];
          }

          if(!entityOutOfView && !hoverTrail) {
            _this._axisProjections(d);
          }

          //set tooltip and show axis projections
          if(text && !entityOutOfView && !hoverTrail) {
            _this._setTooltip(text, x, y, s);
          }

          var selectedData = utils.find(_this.model.entities.select, function(f) {
            return f[KEY] == d[KEY];
          });
          if(selectedData) {
            var clonedSelectedData = utils.clone(selectedData);
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
        this.labels.highlight(null, false);
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
  }

});

export default BubbleChartComp;
