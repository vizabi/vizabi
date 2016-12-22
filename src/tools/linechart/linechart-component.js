/*!
 * VIZABI LINECHART
 */

import * as utils from 'base/utils';
import Component from 'base/component';

import axisSmart from 'helpers/d3.axisWithLabelPicker';
import collisionResolver from 'helpers/d3.collisionResolver';

import {
  warn as iconWarn,
  question as iconQuestion
} from 'base/iconset';

//LINE CHART COMPONENT
var LCComponent = Component.extend({

  init: function(config, context) {
    var _this = this;
    this.name = 'linechart';
    this.template = require('./linechart.html');

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
      'change:time.value': function() {
        if(!_this._readyOnce) return;
        _this.model.marker.getFrame(_this.model.time.value, function(frame, time) {
          if (!_this._frameIsValid(frame)) return utils.warn("change:time.value: empty data received from marker.getFrame(). doing nothing");
          _this.frameChanged(frame, time);
        });
      },
      'change:time.playing': function() {
        // hide tooltip on touch devices when playing
        if (_this.model.time.playing && utils.isTouchDevice() && !_this.tooltip.classed("vzb-hidden")) _this.tooltip.classed("vzb-hidden", true);
      },
      'change:time.start': function() {
        if(!_this._readyOnce) return;
        _this.updateShow();
      },
      'change:time.end': function() {
        if(!_this._readyOnce) return;
        _this.updateShow();
      },
      'change:marker': function(evt, path) {
        if(!_this._readyOnce) return;
        if(path.indexOf("domainMin") > -1 || path.indexOf("domainMax") > -1 ||
          path.indexOf("zoomedMin") > -1 || path.indexOf("zoomedMax") > -1) {
          if(!_this.yScale || !_this.xScale) return; //abort if building of the scale is in progress
          _this.updateShow();
          _this.zoomToMaxMin();
          _this.updateSize();
          _this.updateTime();
          _this.redrawDataPoints();
          return;
        }
        if(path.indexOf("scaleType") > -1) {
          _this.updateShow();
          _this.zoomToMaxMin();
          _this.updateSize();
          _this.redrawDataPoints();
        }
      },
      "change:marker.highlight": function() {
        if(!_this._readyOnce) return;
        _this.highlightLines();
      },
      "change:marker.select": function() {
        if(!_this._readyOnce) return;
        _this.updateDoubtOpacity();
        _this.highlightLines();
      },
      'change:marker.opacitySelectDim': function() {
        if(!_this._readyOnce) return;
        _this.highlightLines();
      },
      'change:marker.opacityRegular': function() {
        if(!_this._readyOnce) return;
        _this.highlightLines();
      }
    };

    this._super(config, context);

    this.xScale = null;
    this.yScale = null;

    this.rangeXRatio = 1;
    this.rangeXShift = 0;

    this.rangeYRatio = 1;
    this.rangeYShift = 0;
    this.lineWidthScale = d3.scale.linear().domain([0, 20]).range([7, 1]).clamp(true);
    this.xAxis = axisSmart().orient("bottom");
    this.yAxis = axisSmart().orient("left");

    this.isDataPreprocessed = false;
    this.timeUpdatedOnce = false;
    this.sizeUpdatedOnce = false;

    this.getNearestKey = utils.memoize(this.getNearestKey);
  },

  /*
   * domReady:
   * Executed after template is loaded
   * Ideally, it contains instantiations related to template
   */
  readyOnce: function() {
    var _this = this;

    this.element = d3.select(this.element);
    this.graph = this.element.select('.vzb-lc-graph');

    this.yAxisElContainer = this.graph.select('.vzb-lc-axis-y');
    this.yAxisEl = this.yAxisElContainer.select('g');

    this.xAxisElContainer = this.graph.select('.vzb-lc-axis-x');
    this.xAxisEl = this.xAxisElContainer.select('g');

    this.xTitleEl = this.graph.select('.vzb-lc-axis-x-title');
    this.yTitleEl = this.graph.select('.vzb-lc-axis-y-title');
    this.yInfoEl = this.graph.select('.vzb-lc-axis-y-info');
    this.linesContainerCrop = this.graph.select('.vzb-lc-lines-crop');
    this.linesContainer = this.graph.select('.vzb-lc-lines');
    this.labelsContainerCrop = this.graph.select('.vzb-lc-labels-crop');
    this.labelsContainer = this.graph.select('.vzb-lc-labels');
    
    this.dataWarningEl = this.graph.select('.vzb-data-warning');
    
    this.verticalNow = this.labelsContainer.select(".vzb-lc-vertical-now");
    this.tooltip = this.element.select('.vzb-tooltip');
    //            this.filterDropshadowEl = this.element.select('#vzb-lc-filter-dropshadow');
    this.projectionX = this.graph.select(".vzb-lc-projection-x");
    this.projectionY = this.graph.select(".vzb-lc-projection-y");

    this.entityLines = null;
    this.entityLabels = null;
    this.totalLength_1 = {};

    this.KEY = this.model.entities.getDimension();
    this.collisionResolver = collisionResolver()
      .selector(".vzb-lc-label")
      .value("valueY");

    //component events

    utils.setIcon(this.yInfoEl, iconQuestion)
      .select("svg").attr("width", "0px").attr("height", "0px");

    this.yInfoEl.on("click", function() {
      _this.parent.findChildByName("gapminder-datanotes").pin();
    });
    this.yInfoEl.on("mouseover", function() {
      var rect = this.getBBox();
      var coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      _this.parent.findChildByName("gapminder-datanotes").setHook('axis_y').show().setPos(coord.x, coord.y);
    });
    this.yInfoEl.on("mouseout", function() {
      _this.parent.findChildByName("gapminder-datanotes").hide();
    });

    this.wScale = d3.scale.linear()
      .domain(this.model.ui.datawarning.doubtDomain)
      .range(this.model.ui.datawarning.doubtRange);

    this.on("resize", function() {
      //return if updatesize exists with error
      if(_this.updateSize()) return;
      _this.updateTime();
      _this.redrawDataPoints();
    });
  },

  ready: function() {
    this.all_steps = this.model.time.getAllSteps();
    this.all_values = this.values = null;
    this.updateTime();
    this.updateUIStrings();
    this.updateShow();
    var _this = this;
    //null means we need to calculate all frames before we get to the callback
    this.model.marker.getFrame(null, function(allValues) {
      _this.all_values = allValues;
      _this.model.marker.getFrame(_this.model.time.value, function (values) {
        if (!_this._frameIsValid(values)) return;
        _this.values = values;
        _this.updateShow();
        _this.updateSize();
        _this.updateDoubtOpacity();
        _this.zoomToMaxMin();
        _this.redrawDataPoints();
        _this.linesContainerCrop
          .on('mousemove', _this.entityMousemove.bind(_this, null, null, _this))
          .on('mouseleave', _this.entityMouseout.bind(_this, null, null, _this));

      });
    });
  },

  _frameIsValid: function(frame) {
    return !(!frame
    || Object.keys(frame.axis_y).length === 0
    || Object.keys(frame.axis_x).length === 0
    || Object.keys(frame.color).length === 0);
  },

  frameChanged: function(frame, time) {
//    if (time.toString() != this.model.time.value.toString()) return; // frame is outdated
    this.frame = frame;
    this.updateTime();
    if (!this.all_values) return;
    this.redrawDataPoints();
  },


  updateUIStrings: function() {
    var _this = this;
    var conceptPropsY = _this.model.marker.axis_y.getConceptprops();
    var conceptPropsX = _this.model.marker.axis_x.getConceptprops();
    var conceptPropsC = _this.model.marker.color.getConceptprops();
    this.translator = this.model.locale.getTFunction();

    this.strings = {
      title: {
        Y: conceptPropsY.name,
        X: conceptPropsX.name,
        C: conceptPropsC.name
      },
      unit: {
        Y: conceptPropsY.unit || "",
        X: conceptPropsX.unit || "",
        C: conceptPropsC.unit || ""
      }
    };

    if(this.strings.unit.Y === "unit/" + this.model.marker.axis_y.which) this.strings.unit.Y = "";
    if(this.strings.unit.X === "unit/" + this.model.marker.axis_x.which) this.strings.unit.X = "";
    if(this.strings.unit.C === "unit/" + this.model.marker.color.which) this.strings.unit.C = "";

    if(!!this.strings.unit.Y) this.strings.unit.Y = ", " + this.strings.unit.Y;
    if(!!this.strings.unit.X) this.strings.unit.X = ", " + this.strings.unit.X;
    if(!!this.strings.unit.C) this.strings.unit.C = ", " + this.strings.unit.C;

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
      })

    var xTitle = this.xTitleEl.selectAll("text").data([0]);
    xTitle.enter().append("text");

    var yTitle = this.yTitleEl.selectAll("text").data([0]);
    yTitle.enter().append("text");
    yTitle
      .on("click", function() {
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_y")
          .alignX("left")
          .alignY("top")
          .updateView()
          .toggle();
      });

  },

  updateDoubtOpacity: function (opacity) {
    if (opacity == null) opacity = this.wScale(+this.time.getUTCFullYear().toString());
    if (this.someSelected) opacity = 1;
    this.dataWarningEl.style("opacity", opacity);
  },


  /*
   * UPDATE SHOW:
   * Ideally should only update when show parameters change or data changes
   */
  updateShow: function() {
    var _this = this;
    var KEY = this.KEY;

    this.cached = {};
    //scales
    this.yScale = this.model.marker.axis_y.getScale();
    if (!this.splash) {
      var limits = this.model.marker.axis_y.getLimits(this.model.marker.axis_y.which);
      this.yScale.domain([limits.min, limits.max]);
    }
    this.xScale = this.model.marker.axis_x.getScale();
    this.cScale = this.model.marker.color.getScale();
    this.yAxis.tickFormat(this.model.marker.axis_y.getTickFormatter());
    this.xAxis.tickFormat(this.model.marker.axis_x.getTickFormatter());

    this.collisionResolver.scale(this.yScale)
      .KEY(KEY);

    this.data = this.model.marker.getKeys();

    this.entityLines = this.linesContainer.selectAll('.vzb-lc-entity').data(this.data);
    this.entityLines.exit().remove();
    this.entityLines.enter().append("g")
      .attr("class", "vzb-lc-entity")
      .each(function(d, index) {
        var entity = d3.select(this);

        entity.append("path")
          .attr("class", "vzb-lc-line-shadow")

        entity.append("path")
          .attr("class", "vzb-lc-line");

      });
    
    this.entityLabels = this.labelsContainer.selectAll('.vzb-lc-entity').data(this.data);
    this.entityLabels.exit().remove();
    this.entityLabels.enter().append("g")
      .attr("class", "vzb-lc-entity")
      .each(function(d, index) {
        var entity = d3.select(this);

        entity.append("circle")
          .attr("class", "vzb-lc-circle")
          .attr("cx", 0);
        
        var labelGroup = entity.append("g").attr("class", "vzb-lc-label");
        
        labelGroup.append("text")
          .attr("class", "vzb-lc-labelname")
          .attr("dy", ".35em");

        labelGroup.append("text")
          .attr("class", "vzb-lc-label-value")
          .attr("dy", "1.6em");
      });

    if (this.all_values && this.values) {
      this.entityLabels.each(function(d, index) {
        var entity = d3.select(this);
        var color = _this.cScale(_this.values.color[d[KEY]]);
        var colorShadow = _this.model.marker.color.which == "geo.world_4region"?
          _this.model.marker.color.getColorShade({
            colorID: _this.values.color[d[KEY]],
            shadeID: "shade"
          })
          :
          d3.rgb(color).darker(0.5).toString();

        var label = _this.values.label[d[KEY]];
        var value = _this.yAxis.tickFormat()(_this.values.axis_y[d[KEY]]);
        var name = label.length < 13 ? label : label.substring(0, 10) + '...';
        var valueHideLimit = _this.ui.chart.labels.min_number_of_entities_when_values_hide;

        entity.select("circle").style("fill", color);
        entity.select(".vzb-lc-labelname")
          .style("fill", colorShadow)
          .text(name + " " + (_this.data.length < valueHideLimit ? value : ""));

        entity.select(".vzb-lc-label-value")
          .style("fill", colorShadow);

      });
    }

    //line template
    this.line = d3.svg.line()
      //see https://bl.ocks.org/mbostock/4342190
      //"monotone" can also work. "basis" would skip the points on the sharp turns. "linear" is ugly
      .interpolate("cardinal")
      .x(function(d) {
        return _this.xScale(d[0]);
      })
      .y(function(d) {
        return _this.yScale(d[1]);
      });
  },


  /*
   * UPDATE TIME:
   * Ideally should only update when time or data changes
   */
  updateTime: function() {
    var _this = this;
    var KEY = this.KEY;
    var time_1 = (this.time === null) ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    this.duration = this.model.time.playing && (this.time - time_1 > 0) ? this.model.time.delayAnimations : 0;

    var timeDim = this.model.time.getDimension();
    var filter = {};

    filter[timeDim] = this.time;

    this.prev_steps = this.all_steps.filter(function(f){return f < _this.time;});

    this.timeUpdatedOnce = true;

  },

  profiles: {
    "small": {
      margin: {
        top: 30,
        right: 20,
        left: 40,
        bottom: 20
      },
      infoElHeight: 16,
      yAxisTitleBottomMargin: 6,
      tick_spacing: 60,
      text_padding: 12,
      lollipopRadius: 6,
      limitMaxTickNumberX: 5
    },
    "medium": {
      margin: {
        top: 40,
        right: 60,
        left: 60,
        bottom: 25
      },
      infoElHeight: 20,
      yAxisTitleBottomMargin: 6,
      tick_spacing: 80,
      text_padding: 15,
      lollipopRadius: 7,
      limitMaxTickNumberX: 10
    },
    "large": {
      margin: {
        top: 50,
        right: 60,
        left: 60,
        bottom: 30
      },
      infoElHeight: 22,
      yAxisTitleBottomMargin: 6,
      tick_spacing: 100,
      text_padding: 20,
      lollipopRadius: 9,
      limitMaxTickNumberX: 0 // unlimited
    }
  },
  presentationProfileChanges: {
    "medium": {
      margin: { top: 70, bottom: 40, left: 70 },
      yAxisTitleBottomMargin: 20,
      xAxisTitleBottomMargin: 20,
      infoElHeight: 26,
      text_padding: 30
    },
    "large": {
      margin: { top: 70, bottom: 50, left: 70 },
      yAxisTitleBottomMargin: 20,
      xAxisTitleBottomMargin: 20,
      infoElHeight: 32,
      text_padding: 36,
      hideSTitle: true
    }
  },

  timeSliderProfiles: {
    small: {
      margin: {
        top: 9,
        right: 15,
        bottom: 10,
        left: 10
      }
    },
    medium: {
      margin: {
        top: 9,
        right: 15,
        bottom: 10,
        left: 20
      }
    },
    large: {
      margin: {
        top: 9,
        right: 15,
        bottom: 10,
        left: 25
      }
    }
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   * Ideally, it contains only operations related to size
   */
  updateSize: function() {

    var _this = this;
    var values = this.values;
    var KEY = this.KEY;

    var padding = 2;

    this.activeProfile = this.getActiveProfile(this.profiles, this.presentationProfileChanges);
    this.margin = this.activeProfile.margin;
    this.tick_spacing = this.activeProfile.tick_spacing;

    var infoElHeight = this.activeProfile.infoElHeight;

    //adjust right this.margin according to biggest label

    var longestLabelWidth = 0;
    
    this.entityLabels.selectAll(".vzb-lc-labelname")
      .attr("dx", _this.activeProfile.text_padding)
      .each(function(d, index) {
        var width = this.getComputedTextLength();
        if (width > longestLabelWidth) longestLabelWidth = width; 
      });
    
    this.entityLabels.selectAll(".vzb-lc-circle")
      .attr("r", _this.activeProfile.lollipopRadius);

    this.margin.right  = Math.max(this.margin.right, longestLabelWidth + this.activeProfile.text_padding + 20);


    //stage
    this.height = (parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right) || 0;
    this.linesContainerCrop
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));

    this.labelsContainerCrop
      .attr("width", this.width + this.margin.right)
      .attr("height", Math.max(0, this.height));

    if(this.height<=0 || this.width<=0) return utils.warn("Line chart updateSize() abort: vizabi container is too little or has display:none");

    this.collisionResolver.height(this.height);

    this.graph
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.yScale.range([this.height - this.activeProfile.lollipopRadius, this.activeProfile.lollipopRadius]);
    this.xScale.range([this.rangeXShift, this.width * this.rangeXRatio + this.rangeXShift]);

    
    this.yAxis.scale(this.yScale)
      .orient("left")
      .tickSize(-this.width, 0)
      .tickPadding(6)
      .tickSizeMinor(-this.width, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_y.scaleType,
        toolMargin: this.margin,
        limitMaxTickNumber: 6,
        viewportLength: this.height,
        formatter: this.model.marker.axis_y.getTickFormatter()
      });

    this.xAxis.scale(this.xScale)
      .tickSize(-this.height, 0)
      .tickSizeMinor(-this.height, 0)
      .tickPadding(6)
      .labelerOptions({
        scaleType: this.model.marker.axis_x.scaleType,
        limitMaxTickNumber: this.activeProfile.limitMaxTickNumberX,
        toolMargin: this.margin,
        bump: this.activeProfile.text_padding * 2,
        formatter: this.model.marker.axis_x.getTickFormatter()
        //showOuter: true
      });

    this.xAxisElContainer
      .attr("width", this.width + this.activeProfile.text_padding * 2)
      .attr("height", this.activeProfile.margin.bottom + this.height)
      .attr("y", - 1)
      .attr("x", - this.activeProfile.text_padding);
    
    this.xAxisEl
      .attr("transform", "translate(" + (this.activeProfile.text_padding - 1) + "," + (this.height + 1) + ")");

    this.yAxisElContainer
      .attr("width", this.activeProfile.margin.left + this.width)
      .attr("height", Math.max(0, this.height))
      .attr("x", -this.activeProfile.margin.left);
    this.yAxisEl
      .attr("transform", "translate(" + (this.activeProfile.margin.left - 1) + "," + 0 + ")");

    this.yAxisEl.call(this.yAxis);
    this.xAxisEl.call(this.xAxis);

    this.yTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + (10-this.activeProfile.margin.left) + ", -" + this.activeProfile.yAxisTitleBottomMargin + ")");

    var yTitleText = this.yTitleEl.select("text").text(this.strings.title.Y + this.strings.unit.Y);
    if(yTitleText.node().getBBox().width > this.width) yTitleText.text(this.strings.title.Y);

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

    var warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
      .attr("width", warnBB.height * 0.75)
      .attr("height", warnBB.height * 0.75)
      .attr("x", -warnBB.width - warnBB.height * 1.2)
      .attr("y", -warnBB.height * 0.65)

    this.dataWarningEl
      .attr("transform", "translate(" + (this.width + warnBB.width + warnBB.height * 2) + 
      ",-" + this.activeProfile.yAxisTitleBottomMargin + ")")
      .select("text");


    var xTitleText = this.xTitleEl.select("text").text(this.strings.title.X + this.strings.unit.X);

    this.xTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + 
        (this.width + this.activeProfile.text_padding + this.activeProfile.yAxisTitleBottomMargin) + "," + 
        (this.height + xTitleText.node().getBBox().height  * 0.72) + ")");

    if(xTitleText.node().getBBox().width > this.width - 100) xTitleText.text(this.strings.title.X);

    // adjust the vertical dashed line
    this.verticalNow.attr("y1", this.yScale.range()[0]).attr("y2", this.yScale.range()[1])
      .attr("x1", 0).attr("x2", 0);
    this.projectionX.attr("y1", _this.yScale.range()[0]);
    this.projectionY.attr("x2", _this.xScale.range()[0]);

    if(utils.isTouchDevice()) {
      _this.tooltip.classed("vzb-hidden", true);
      _this.verticalNow.style("opacity", 1);
      _this.projectionX.style("opacity", 0);
      _this.projectionY.style("opacity", 0);
      _this.xAxisEl.call(_this.xAxis.highlightValue(_this.time));
      _this.yAxisEl.call(_this.yAxis.highlightValue("none"));
      _this.graph.selectAll(".vzb-lc-entity").each(function() {
        d3.select(this).classed("vzb-dimmed", false).classed("vzb-hovered", false);
      });

      _this.hoveringNow = null;
    }
    var opts = {
      rangeMax: this.xScale.range()[1],
      mRight: this.margin.right,
      profile: this.timeSliderProfiles[this.getLayoutProfile()]
    };
    this.parent.trigger('myEvent', opts);

    this.sizeUpdatedOnce = true;
  },

  /*
   * REDRAW DATA POINTS:
   * Here plotting happens
   */
  redrawDataPoints: function() {
    var _this = this;
    var KEY = this.KEY;
//    var values = this.values;

    if (!_this.all_values) return;
    this.model.marker.getFrame(this.time, function(values, time) {
      if (!_this._frameIsValid(values)) return;
      _this.values = values;
      if(!_this.timeUpdatedOnce) {
        _this.updateTime();
      }
      if(!_this.sizeUpdatedOnce) {
        _this.updateSize();
      }
      _this.updateDoubtOpacity();
      
      _this.lineWidth = _this.lineWidthScale(_this.data.length);
      _this.shadowWidth = _this.lineWidth * 1.3;
      _this.entityLines
        .each(function(d, index) {
          var entity = d3.select(this);
          var label = values.label[d[KEY]];

          var color = _this.cScale(values.color[d[KEY]]);
          var colorShadow = _this.model.marker.color.which == "geo.world_4region"?
              _this.model.marker.color.getColorShade({
                colorID: values.color[d[KEY]],
                shadeID: "shade"
              })
              :
              d3.rgb(color).darker(0.5).toString();

          //TODO: optimization is possible if getValues would return both x and time
          //TODO: optimization is possible if getValues would return a limited number of points, say 1 point per screen pixel
          
          var xy = _this.prev_steps.map(function(frame, i) {
              return [frame, _this.all_values[frame] ? _this.all_values[frame].axis_y[d[KEY]] : null] ;
            })
            .filter(function(d) { return d[1] || d[1] === 0; });

          // add last point 
          if (values.axis_y[d[KEY]]) {
            xy.push([values.axis_x[d[KEY]], values.axis_y[d[KEY]]]);
          }
          
          if (xy.length > 0) {
            _this.cached[d[KEY]] = {
              valueX: xy[xy.length - 1][0],
              valueY: xy[xy.length - 1][1]
            };
          } else {
            delete _this.cached[d[KEY]];
          }


          // the following fixes the ugly line butts sticking out of the axis line
          //if(x[0]!=null && x[1]!=null) xy.splice(1, 0, [(+x[0]*0.99+x[1]*0.01), y[0]]);
          var path2 = entity.select(".vzb-lc-line");

          if(_this.model.time.playing && _this.totalLength_1[d[KEY]] === null) {
            _this.totalLength_1[d[KEY]] = path2.node().getTotalLength();
          }

          var path1 = entity.select(".vzb-lc-line-shadow")
            
            .style("stroke", colorShadow)
            .style("stroke-width", _this.shadowWidth + "px")
            .attr("transform", "translate(0, " + (_this.shadowWidth - _this.lineWidth) + ")")
            .attr("d", _this.line(xy));
          path2
            //.style("filter", "none")
            .style("stroke", color)
            .style("stroke-width", _this.lineWidth + "px")
            .attr("d", _this.line(xy));
          var totalLength = path2.node().getTotalLength();

          // this section ensures the smooth transition while playing and not needed otherwise
          if(_this.model.time.playing) {

            path1
              .interrupt()
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d[KEY]])
              .transition()
              .delay(0)
              .duration(_this.duration)
              .ease("linear")
              .attr("stroke-dashoffset", 0);
            path2
              .interrupt()
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d[KEY]])
              .transition()
              .delay(0)
              .duration(_this.duration)
              .ease("linear")
              .attr("stroke-dashoffset", 0);

            _this.totalLength_1[d[KEY]] = totalLength;
          } else {
            //reset saved line lengths
            _this.totalLength_1[d[KEY]] = null;

            path1
              .attr("stroke-dasharray", "none")
              .attr("stroke-dashoffset", "none");

            path2
              .attr("stroke-dasharray", "none")
              .attr("stroke-dashoffset", "none");
          }

        });

      _this.entityLabels
        .each(function(d, index) {
          var entity = d3.select(this);
          if (_this.cached[d[KEY]]) {
            entity
              .classed("vzb-hidden", false)
              .transition()
              .duration(_this.duration)
              .ease("linear")
              .attr("transform", "translate(" + _this.xScale(d3.min([_this.cached[d[KEY]]["valueX"]])) + ",0)");

            entity.select(".vzb-lc-circle")
              .transition()
              .duration(_this.duration)
              .ease("linear")
              .attr("cy", _this.yScale(_this.cached[d[KEY]]["valueY"]) + 1);



            entity.select(".vzb-lc-label")
              .transition()
              .duration(_this.duration)
              .ease("linear")
              .attr("transform", "translate(0," + _this.yScale(_this.cached[d[KEY]]["valueY"]) + ")");
          } else {
            entity
              .classed("vzb-hidden", true);
          }
        });
      _this.verticalNow
        .transition()
        .duration(_this.duration)
        .ease("linear")
        .attr("transform", "translate(" + _this.xScale(d3.min([_this.model.marker.axis_x.zoomedMax, _this.time])) + ",0)");



      if(!_this.hoveringNow && _this.time - _this.model.time.start !== 0) {
        if (!_this.ui.chart.hideXAxisValue) _this.xAxisEl.call(
           _this.xAxis
            .highlightTransDuration(_this.duration)
            .highlightValue(_this.time)
        );
        _this.verticalNow.style("opacity", 1);
      }else{
        _this.verticalNow.style("opacity", 0);
      }

      // Call flush() after any zero-duration transitions to synchronously flush the timer queue
      // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
      if(_this.duration == 0) {
        d3.timer.flush();
      }

      // cancel previously queued simulation if we just ordered a new one
      // then order a new collision resolving
      clearTimeout(_this.collisionTimeout);
      _this.collisionTimeout = setTimeout(function() {
        _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
      }, _this.model.time.delayAnimations * 1.5);

    });
  },

  entityMousemove: function(me, index, context, closestToMouse) {
    var _this = context;
    var KEY = _this.KEY;
    var values = _this.values;

    var mouse = d3.mouse(_this.element.node()).map(function(d) {
      return parseInt(d);
    });

    var resolvedTime = _this.xScale.invert(mouse[0] - _this.margin.left);
    if(_this.time - resolvedTime < 0) {
      resolvedTime = _this.time;
    } else if(resolvedTime < this.model.time['start']) {
      resolvedTime = this.model.time['start'];
    }
    var resolvedValue;
    var timeDim = _this.model.time.getDimension();

    var mousePos = mouse[1] - _this.margin.bottom;

    if(!utils.isDate(resolvedTime)) resolvedTime = this.model.time.timeFormat.parse(resolvedTime);

    this.model.marker.getFrame(resolvedTime, function(data) {
      if (!_this._frameIsValid(data)) return;
      var nearestKey = _this.getNearestKey(mousePos, data.axis_y, _this.yScale.bind(_this));
      resolvedValue = data.axis_y[nearestKey];
      if(!me) me = {};
      me[KEY] = nearestKey;
      if (!_this.model.marker.isHighlighted(me)) {
        _this.model.marker.clearHighlighted();
        _this.model.marker.highlightMarker(me);
      }
      _this.hoveringNow = me;
  
      if(utils.isNaN(resolvedValue)) return;
  
      var scaledTime = _this.xScale(resolvedTime);
      var scaledValue = _this.yScale(resolvedValue);
  
      if(_this.ui.chart.whenHovering.showTooltip) {
        //position tooltip
        _this.tooltip
          //.style("right", (_this.width - scaledTime + _this.margin.right ) + "px")
          .style("left", (scaledTime + _this.margin.left) + "px")
          .style("bottom", (_this.height - scaledValue + _this.margin.bottom) + "px")
          .text(_this.yAxis.tickFormat()(resolvedValue))
          .classed("vzb-hidden", false);
      }
  
      // bring the projection lines to the hovering point
      if(_this.ui.chart.whenHovering.hideVerticalNow) {
        _this.verticalNow.style("opacity", 0);
      }
  
      if(_this.ui.chart.whenHovering.showProjectionLineX) {
        _this.projectionX
          .style("opacity", 1)
          .attr("y2", scaledValue)
          .attr("x1", scaledTime)
          .attr("x2", scaledTime);
      }
      if(_this.ui.chart.whenHovering.showProjectionLineY) {
        _this.projectionY
          .style("opacity", 1)
          .attr("y1", scaledValue)
          .attr("y2", scaledValue)
          .attr("x1", scaledTime);
      }
  
      if(_this.ui.chart.whenHovering.higlightValueX) _this.xAxisEl.call(
        _this.xAxis.highlightValue(resolvedTime).highlightTransDuration(0)
      );
  
      if(_this.ui.chart.whenHovering.higlightValueY) _this.yAxisEl.call(
        _this.yAxis.highlightValue(resolvedValue).highlightTransDuration(0)
      );
  
      clearTimeout(_this.unhoverTimeout);

    });
  },

  entityMouseout: function(me, index, context) {
    var _this = context;
    if(d3.event.relatedTarget && d3.select(d3.event.relatedTarget).classed('vzb-tooltip')) return;

    // hide and show things like it was before hovering
    _this.unhoverTimeout = setTimeout(function() {
      _this.tooltip.classed("vzb-hidden", true);
      _this.verticalNow.style("opacity", 1);
      _this.projectionX.style("opacity", 0);
      _this.projectionY.style("opacity", 0);
      _this.xAxisEl.call(_this.xAxis.highlightValue(_this.time));
      _this.yAxisEl.call(_this.yAxis.highlightValue("none"));

      _this.model.marker.clearHighlighted();

      _this.hoveringNow = null;
    }, 300);

  },

  /*
   * Highlights all hovered lines
   */
  highlightLines: function() {
    var _this = this;

    var OPACITY_HIGHLT = 1.0;
    var OPACITY_HIGHLT_DIM = .3;
    var OPACITY_SELECT = this.model.marker.opacityRegular;
    var OPACITY_REGULAR = this.model.marker.opacityRegular;
    var OPACITY_SELECT_DIM = this.model.marker.opacitySelectDim;

    var someHighlighted = (this.model.marker.highlight.length > 0);
    var someSelected = (this.model.marker.select.length > 0);
    this.graph.selectAll(".vzb-lc-entity").each(function() {
      d3.select(this)
        .style("opacity", function(d) {
          if (_this.model.marker.isHighlighted(d)) return OPACITY_HIGHLT;
          if(someSelected) {
            return _this.model.marker.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
          }
          if(someHighlighted) return OPACITY_HIGHLT_DIM;
          return OPACITY_REGULAR;
        });
    });

  },

  zoomToMaxMin: function() {
    var _this = this;
    //
/*
    if(this.model.marker.axis_y.zoomedMin == null ) this.model.marker.axis_y.zoomedMin = this.yScale.domain()[0];
    if(this.model.marker.axis_y.zoomedMax == null ) this.model.marker.axis_y.zoomedMax = this.yScale.domain()[1];
*/


    if (
      this.model.marker.axis_x.zoomedMin != null &&
      this.model.marker.axis_x.zoomedMax != null) {
      this.xScale.domain([this.model.marker.axis_x.zoomedMin, this.model.marker.axis_x.zoomedMax]);
      this.xAxisEl.call(this.xAxis);
    }
    if (
      this.model.marker.axis_y.zoomedMin != null &&
      this.model.marker.axis_y.zoomedMax != null) {
      if ((this.model.marker.axis_y.zoomedMin <= 0 || this.model.marker.axis_y.zoomedMax <= 0)
        && this.model.marker.axis_y.scaleType == "log") {
        this.yScale = d3.scale.genericLog()
          .domain([this.model.marker.axis_y.zoomedMin, this.model.marker.axis_y.zoomedMax])
          .range(this.yScale.range());
        this.model.marker.axis_y.scale = d3.scale.genericLog()
          .domain([this.model.marker.axis_y.zoomedMin, this.model.marker.axis_y.zoomedMax])
          .range(this.yScale.range());
        this.yScale = this.model.marker.axis_y.scale;
      } else {
        this.yScale.domain([this.model.marker.axis_y.zoomedMin, this.model.marker.axis_y.zoomedMax]);
      }
      this.yAxisEl.call(this.yAxis);
    }
  },


  /**
   * Returns key from obj which value has the smallest difference with val
   */
  getNearestKey: function(val, obj, fn) {
    var keys = Object.keys(obj);
    var resKey = keys[0];
    for(var i = 1; i < keys.length; i++) {
      var key = keys[i];
      if(Math.abs((fn ? fn(obj[key]) : obj[key]) - val) < Math.abs((fn ? fn(obj[resKey]) : obj[resKey]) - val)) {
        resKey = key;
      }
    }
    return resKey;
  }

});


export default LCComponent;
