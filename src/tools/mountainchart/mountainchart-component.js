/**
* VIZABI MOUNTAINCHART
* This graph displays income distribution in the world
*
* Original code:
* Angie https://github.com/angieskazka
*
* Contributions:
* IncoCode https://github.com/IncoCode/
* Arthur https://github.com/arthurcamara1
*
* Developed in Gapminder Foundation, 2015
*/

import * as utils from "base/utils";
import Component from "base/component";
import { warn as iconWarn, question as iconQuestion } from "base/iconset";

import Exporter from "helpers/svgexport";
import axisSmart from "helpers/d3.axisWithLabelPicker";
import MountainChartMath from "tools/mountainchart/mountainchart-math";
import Selectlist from "tools/mountainchart/mountainchart-selectlist";
import Probe from "tools/mountainchart/mountainchart-probe";
import DynamicBackground from "helpers/d3.dynamicBackground";
import globals from "base/globals";

const THICKNESS_THRESHOLD = 0.001;
const COLOR_WHITEISH = "#d3d3d3";

//MOUNTAIN CHART COMPONENT
const MountainChartComponent = Component.extend({

    /**
     * Initialize the component
     * Executed once before any template is rendered.
     * @param {Object} config The config passed to the component
     * @param {Object} context The component's parent
     */
  init(config, context) {

    const _this = this;
    this.name = "mountainchart";
    this.template = require("./mountainchart.html");

        //define expected models for this component
    this.model_expects = [
            { name: "time", type: "time" },
            { name: "entities", type: "entities" },
            { name: "marker", type: "model" },
            { name: "locale", type: "locale" },
            { name: "ui", type: "ui" }
    ];

        //attach event listeners to the model items
    this.model_binds = {
      "change:time.value": function(evt) {
        if (!_this._readyOnce) return;
        _this.model.marker.getFrame(_this.model.time.value, _this.frameChanged.bind(_this));
      },
      "change:time.playing": function(evt) {
                // this listener is a patch for fixing #1228. time.js doesn't produce the last event
                // with playing == false when paused softly
        if (!_this.model.time.playing) {
          _this.redrawDataPoints();
        }
      },
      "change:marker.axis_x.xScaleFactor": function() {
        _this.ready();
      },
      "change:marker.axis_x.xScaleShift": function() {
        _this.ready();
      },
      "change:marker.axis_x.tailFatX": function() {
        _this.ready();
      },
      "change:marker.axis_x.tailCutX": function() {
        _this.ready();
      },
      "change:marker.axis_x.tailFade": function() {
        _this.ready();
      },
      "change:ui.chart.probeX": function() {
        _this.ready();
      },
      "change:ui.chart.showProbeX": function() {
        _this.ready();
      },
      "change:ui.chart.xPoints": function() {
        _this.ready();
      },
      "change:ui.chart.xLogStops": function() {
        _this.updateSize();
      },
      "change:ui.chart.yMaxMethod": function() {
        _this._adjustMaxY({ force: true });
        _this.redrawDataPoints();
      },
      "change:time.record": function(evt) {
        if (_this.model.time.record) {
          _this._export.open(this.element, this.name);
        } else {
          _this._export.reset();
        }
      },
      "change:marker.highlight": function(evt) {
        if (!_this._readyOnce) return;
        _this.highlightMarkers();
        _this.updateOpacity();
      },
      "change:marker.select": function(evt) {
        if (!_this._readyOnce) return;
        _this.selectMarkers();
        _this._selectlist.redraw();
        _this.updateOpacity();
        _this.updateDoubtOpacity();
        _this.redrawDataPoints();
      },
      "change:marker.opacitySelectDim": function(evt) {
        _this.updateOpacity();
      },
      "change:marker.opacityRegular": function(evt) {
        _this.updateOpacity();
      },
      "change:marker": function(evt, path) {
        if (!_this._readyOnce) return;
        if (path.indexOf("scaleType") > -1) {
          _this.ready();
        } else if (path.indexOf("zoomedMin") > -1 || path.indexOf("zoomedMax") > -1) {
          _this.zoomToMaxMin();
          _this.redrawDataPoints();
          _this._probe.redraw();
        }
      },
      "change:marker.group": function(evt, path) {
        if (!_this._readyOnce) return;
        if (path.indexOf("group.merge") > -1) return;
        _this.ready();
      },
      "change:marker.group.merge": function(evt) {
        if (!_this._readyOnce) return;
        _this.updatePointers();
        _this.redrawDataPoints();
      },
      "change:marker.stack": function(evt) {
        if (!_this._readyOnce) return;
        _this.ready();
      },
      "change:marker.stack.which": function(evt) {
        if (!_this._readyOnce) return;
        if (_this.model.time.playing) {
          _this.model.time.pause();
        }
      },
      "change:marker.stack.use": function(evt) {
        if (!_this._readyOnce) return;
        if (_this.model.time.playing) {
          _this.model.time.pause();
        }
      },
      "change:marker.color.palette": function(evt) {
        if (!_this._readyOnce) return;
        _this.redrawDataPointsOnlyColors();
        _this._selectlist.redraw();
      },
    };

    this._super(config, context);

    this._math = new MountainChartMath(this);
    this._export = new Exporter(this);
    this._export
      .prefix("vzb-mc-")
      .deleteClasses(["vzb-mc-mountains-mergestacked", "vzb-mc-mountains-mergegrouped", "vzb-mc-mountains", "vzb-mc-year", "vzb-mc-mountains-labels", "vzb-mc-axis-labels"]);
    this._probe = new Probe(this);
    this._selectlist = new Selectlist(this);

        // define path generator
    this.area = d3.area()
            .curve(d3.curveBasis)
            .x(d => _this.xScale(_this._math.rescale(d.x)))
            .y0(d => _this.yScale(d.y0))
            .y1(d => _this.yScale(d.y0 + d.y));

        //define d3 stack layout
    this.stack = d3.stack()
            .order(d3.stackOrderReverse)
            .value((d, key) => _this.cached[key][d].y);

        // init internal variables
    this.xScale = null;
    this.yScale = null;
    this.cScale = null;

    this.xAxis = axisSmart("bottom");


    this.rangeRatio = 1;
    this.rangeShift = 0;
    this.cached = {};
    this.mesh = [];
    this.yMax = 0;
  },

  domReady() {
    const _this = this;

        // reference elements
    this.element = d3.select(this.element);
    this.graph = this.element.select(".vzb-mc-graph");
    this.xAxisEl = this.graph.select(".vzb-mc-axis-x");
    this.xTitleEl = this.graph.select(".vzb-mc-axis-x-title");
    this.yTitleEl = this.graph.select(".vzb-mc-axis-y-title");
    this.infoEl = this.graph.select(".vzb-mc-axis-info");
    this.dataWarningEl = this.graph.select(".vzb-data-warning");

    this.yearEl = this.graph.select(".vzb-mc-year");
    this.year = new DynamicBackground(this.yearEl);

    this.mountainMergeStackedContainer = this.graph.select(".vzb-mc-mountains-mergestacked");
    this.mountainMergeGroupedContainer = this.graph.select(".vzb-mc-mountains-mergegrouped");
    this.mountainAtomicContainer = this.graph.select(".vzb-mc-mountains");
    this.mountainLabelContainer = this.graph.select(".vzb-mc-mountains-labels");
    this.tooltip = this.element.select(".vzb-mc-tooltip");
    this.eventAreaEl = this.element.select(".vzb-mc-eventarea");
    this.probeEl = this.element.select(".vzb-mc-probe");
    this.probeLineEl = this.probeEl.select("line");
    this.probeTextEl = this.probeEl.selectAll("text");

    this.element
      .onTap((d, i) => {
        _this._interact()._mouseout(d, i);
      });
  },

  afterPreload() {
    const _this = this;

    const yearNow = _this.model.time.formatDate(this.model.time.value);
    const yearEnd = _this.model.time.formatDate(this.model.time.end);

    this._math.xScaleFactor = this.model.marker.axis_x.xScaleFactor;
    this._math.xScaleShift = this.model.marker.axis_x.xScaleShift;

    if (!this.precomputedShapes || !this.precomputedShapes[yearNow] || !this.precomputedShapes[yearEnd]) return;

    const yMax = this.precomputedShapes[this.model.ui.chart.yMaxMethod == "immediate" ? yearNow : yearEnd].yMax;
    let shape = this.precomputedShapes[yearNow].shape;

    if (!yMax || !shape || shape.length === 0) return;

    this.xScale = d3.scale.log().domain([this.model.marker.axis_x.domainMin, this.model.marker.axis_x.domainMax]);
    this.yScale = d3.scale.linear().domain([0, Math.round(yMax)]);

    _this.updateSize(shape.length);
    _this.zoomToMaxMin();

    shape = shape.map((m, i) => ({ x: _this.mesh[i], y0: 0, y: +m }));

    this.mountainAtomicContainer.selectAll(".vzb-mc-prerender")
      .data([0])
      .enter().append("path")
      .attr("class", "vzb-mc-prerender")
      .style("fill", "pink")
      .style("opacity", 0)
      .attr("d", _this.area(shape))
      .transition().duration(1000).ease(d3.easeLinear)
      .style("opacity", 1);
  },

  readyOnce() {

    this.eventAreaEl
      .on("mousemove", function() {
        if (_this.model.time.dragging) return;
        if (!_this.model.ui.chart.showProbeX) return;
        _this._probe.redraw({
          level: _this.xScale.invert(d3.mouse(this)[0]),
          full: true
        });
      })
      .on("mouseout", () => {
        if (_this.model.time.dragging) return;
        if (!_this.model.ui.chart.showProbeX) return;
        _this._probe.redraw();
      });

    const _this = this;
    this.on("resize", () => {
            //console.log("acting on resize");
            //return if updatesize exists with error
      if (_this.updateSize()) return;
      _this.updatePointers(); // respawn is needed
      _this.redrawDataPoints();
      _this._selectlist.redraw();
      _this._probe.redraw();
    });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.mountainAtomicContainer.select(".vzb-mc-prerender").remove();
    this.year.setText(this.model.time.formatDate(this.model.time.value));
    this.wScale = d3.scale.linear()
            .domain(this.model.ui.datawarning.doubtDomain)
            .range(this.model.ui.datawarning.doubtRange);
  },

  ready() {
        //console.log("ready")
    const _this = this;

    this._math.xScaleFactor = this.model.marker.axis_x.xScaleFactor;
    this._math.xScaleShift = this.model.marker.axis_x.xScaleShift;

    this.updateUIStrings();
    this.updateIndicators();
    this.model.marker.getFrame(this.model.time.value, values => {
      if (!values) return;
      _this.values = values;
      _this.updateEntities();
      _this.updateSize();
      _this.zoomToMaxMin();
      _this._spawnMasks();
      _this.updateTime();
      _this.updatePointers();
      _this._adjustMaxY({ force: true });
      _this.redrawDataPoints();
      _this.redrawDataPointsOnlyColors();
      _this.highlightMarkers();
      _this.selectMarkers();
      _this._selectlist.redraw();
      _this.updateOpacity();
      _this.updateDoubtOpacity();
      _this._probe.redraw();
    });
  },

  frameChanged(frame, time) {
    if (!frame) return utils.warn("change:time.value: empty data received from marker.getFrame(). doing nothing");
    if (time.toString() != this.model.time.value.toString()) return; // frame is outdated
    this.values = frame;
    this.updateTime();
    this.updatePointers();
    this.redrawDataPoints();
    this._selectlist.redraw();
    this._probe.redraw();
    this.updateDoubtOpacity();
  },


  updateSize(meshLength) {
    const profiles = {
      small: {
        margin: { top: 10, right: 10, left: 10, bottom: 18 },
        infoElHeight: 16
      },
      medium: {
        margin: { top: 20, right: 20, left: 20, bottom: 30 },
        infoElHeight: 20
      },
      large: {
        margin: { top: 30, right: 30, left: 30, bottom: 35 },
        infoElHeight: 22
      }
    };

    const presentationProfileChanges = {
      medium: {
        margin: { top: 20, right: 20, left: 20, bottom: 50 },
        infoElHeight: 26
      },
      large: {
        margin: { top: 30, right: 30, left: 30, bottom: 50 },
        infoElHeight: 32
      }
    };

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);
    const { margin } = this.activeProfile;
    const { infoElHeight } = this.activeProfile;

        //mesure width and height
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if (this.height <= 0 || this.width <= 0) return utils.warn("Mountain chart updateSize() abort: vizabi container is too little or has display:none");

        //graph group is shifted according to margins (while svg element is at 100 by 100%)
    this.graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const isRTL = this.model.locale.isRTL();

    const yearLabelOptions = {
      topOffset: this.getLayoutProfile() === "large" ? margin.top * 2 : 0,
      xAlign: this.getLayoutProfile() === "large" ? (isRTL ? "left" : "right") : "center",
      yAlign: this.getLayoutProfile() === "large" ? "top" : "center",
      widthRatio: this.getLayoutProfile() === "large" ? 3 / 8 : 8 / 10
    };

        //year is centered and resized
    this.year
      .setConditions(yearLabelOptions)
      .resize(this.width, this.height);

        //update scales to the new range
    this.yScale.range([this.height, 0]);
    this.xScale.range([this.rangeShift, this.width * this.rangeRatio + this.rangeShift]);


        //need to know scale type of X to move on
    const scaleType = this._readyOnce ? this.model.marker.axis_x.scaleType : "log";

        //axis is updated
    this.xAxis.scale(this.xScale)
      .tickSizeOuter(0)
      .tickPadding(9)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType,
        toolMargin: margin,
        pivotingLimit: margin.bottom * 1.5,
        method: this.xAxis.METHOD_REPEATING,
        stops: this._readyOnce ? this.model.ui.chart.xLogStops : [1],
        formatter: this.model.marker.axis_x.getTickFormatter()
      });


    this.xAxisEl
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);

    this.xTitleEl.select("text")
      .attr("transform", "translate(" + this.width + "," + this.height + ")")
      .attr("dy", "-0.36em");

    this.yTitleEl
      .style("font-size", infoElHeight + "px")
      .attr("transform", "translate(" + (isRTL ? this.width : 0) + "," + margin.top + ")");


    const warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
      .attr("width", warnBB.height)
      .attr("height", warnBB.height)
      .attr("x", warnBB.height * 0.1)
      .attr("y", -warnBB.height * 1.0 + 1);

    this.dataWarningEl
      .attr("transform", "translate(" + (isRTL ? this.width - warnBB.width - warnBB.height * 2 : 0) + "," + (margin.top + warnBB.height * 1.5) + ")")
      .select("text")
      .attr("dx", warnBB.height * 1.5);

    if (this.infoEl.select("svg").node()) {
      const titleBBox = this.yTitleEl.node().getBBox();
      const t = utils.transform(this.yTitleEl.node());
      const hTranslate = isRTL ? (titleBBox.x + t.translateX - infoElHeight * 1.4) : (titleBBox.x + t.translateX + titleBBox.width + infoElHeight * 0.4);

      this.infoEl.select("svg")
        .attr("width", infoElHeight + "px")
        .attr("height", infoElHeight + "px");
      this.infoEl.attr("transform", "translate("
                + hTranslate + ","
                + (t.translateY - infoElHeight * 0.8) + ")");
    }

    this.eventAreaEl
      .attr("y", this.height)
      .attr("width", this.width)
      .attr("height", margin.bottom);

    if (!meshLength) meshLength = this.model.ui.chart.xPoints;
    this.mesh = this._math.generateMesh(meshLength, scaleType, this.xScale.domain());
  },


  zoomToMaxMin() {
    const _this = this;

    if (this.model.marker.axis_x.zoomedMin == null || this.model.marker.axis_x.zoomedMax == null) return;

    const x1 = this.xScale(this.model.marker.axis_x.zoomedMin);
    const x2 = this.xScale(this.model.marker.axis_x.zoomedMax);

    this.rangeRatio = this.width / (x2 - x1) * this.rangeRatio;
    this.rangeShift = (this.rangeShift - x1) / (x2 - x1) * this.width;

    this.xScale.range([this.rangeShift, this.width * this.rangeRatio + this.rangeShift]);

    this.xAxisEl.call(this.xAxis);
  },


  updateUIStrings() {
    const _this = this;

    this.translator = this.model.locale.getTFunction();
    const xConceptprops = this.model.marker.axis_x.getConceptprops();


    this.xTitleEl.select("text")
      .text(this.translator("unit/mountainchart_hardcoded_income_per_day"));

    this.yTitleEl.select("text")
      .text(this.translator("mount/title"));

    utils.setIcon(this.dataWarningEl, iconWarn).select("svg").attr("width", "0px").attr("height", "0px");
    this.dataWarningEl.append("text")
      .text(this.translator("hints/dataWarning"));

    utils.setIcon(this.infoEl, iconQuestion).select("svg").attr("width", "0px").attr("height", "0px");

        //TODO: move away from UI strings, maybe to ready or ready once
    this.infoEl.on("click", () => {
      _this.parent.findChildByName("gapminder-datanotes").pin();
    });
    this.infoEl.on("mouseover", function() {
      const rect = this.getBBox();
      const coord = utils.makeAbsoluteContext(this, this.farthestViewportElement)(rect.x - 10, rect.y + rect.height + 10);
      const toolRect = _this.root.element.getBoundingClientRect();
      const chartRect = _this.element.node().getBoundingClientRect();
      _this.parent.findChildByName("gapminder-datanotes").setHook("axis_y").show().setPos(coord.x + chartRect.left - toolRect.left, coord.y);
    });
    this.infoEl.on("mouseout", () => {
      _this.parent.findChildByName("gapminder-datanotes").hide();
    });


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
  },

  updateDoubtOpacity(opacity) {
    if (opacity == null) opacity = this.wScale(+this.time.getUTCFullYear().toString());
    if (this.someSelected) opacity = 1;
    this.dataWarningEl.style("opacity", opacity);
  },

  updateIndicators() {
    const _this = this;

        //fetch scales, or rebuild scales if there are none, then fetch
    this.yScale = this.model.marker.axis_y.getScale();
    this.xScale = this.model.marker.axis_x.getScale();
    this.cScale = this.model.marker.color.getScale();

    this.xAxis.tickFormat(_this.model.marker.axis_x.getTickFormatter());
  },

  updateEntities() {
    const _this = this;

        // construct pointers
    this.mountainPointers = this.model.marker.getKeys()
            .filter(d => 1
                && _this.values.axis_x[d[_this.KEY]]
                && _this.values.axis_y[d[_this.KEY]]
                && _this.values.axis_s[d[_this.KEY]])
            .map(d => {
              const pointer = {};
              pointer[_this.KEY] = d[_this.KEY];
              pointer.KEY = function() {
                return this[_this.KEY];
              };
              pointer.sortValue = [_this.values.axis_y[pointer.KEY()] || 0, 0];
              pointer.aggrLevel = 0;
              return pointer;
            });


        //TODO: optimise this!
    this.groupedPointers = d3.nest()
            .key(d => _this.model.marker.stack.use === "property" ? _this.values.stack[d.KEY()] : _this.values.group[d.KEY()])
            .sortValues((a, b) => b.sortValue[0] - a.sortValue[0])
            .entries(this.mountainPointers);


    const groupManualSort = this.model.marker.group.manualSorting;
    this.groupedPointers.forEach(group => {
      let groupSortValue = d3.sum(group.values.map(m => m.sortValue[0]));

      if (groupManualSort && groupManualSort.length > 1) groupSortValue = groupManualSort.length - 1 - groupManualSort.indexOf(group.key);

      group.values.forEach(d => {
        d.sortValue[1] = groupSortValue;
      });

      group[_this.model.entities.getDimension()] = group.key; // hack to get highlihgt and selection work
      group.KEY = function() {
        return this.key;
      };
      group.aggrLevel = 1;
    });

    const sortGroupKeys = {};
    _this.groupedPointers.forEach(m => {
      sortGroupKeys[m.key] = m.values[0].sortValue[1];
    });


        // update the stacked pointers
    if (_this.model.marker.stack.which === "none") {
      this.stackedPointers = [];
      this.mountainPointers.sort((a, b) => b.sortValue[0] - a.sortValue[0]);

    } else {
      this.stackedPointers = d3.nest()
                .key(d => _this.values.stack[d.KEY()])
                .key(d => _this.values.group[d.KEY()])
                .sortKeys((a, b) => sortGroupKeys[b] - sortGroupKeys[a])
                .sortValues((a, b) => b.sortValue[0] - a.sortValue[0])
                .entries(this.mountainPointers);

      this.mountainPointers.sort((a, b) => b.sortValue[1] - a.sortValue[1]);


      this.stackedPointers.forEach(stack => {
        stack.KEY = function() {
          return this.key;
        };
        stack[_this.model.entities.getDimension()] = stack.key; // hack to get highlihgt and selection work
        stack.aggrLevel = 2;
      });
    }

        //bind the data to DOM elements
    this.mountainsMergeStacked = this.mountainAtomicContainer.selectAll(".vzb-mc-mountain.vzb-mc-aggrlevel2")
            .data(this.stackedPointers);
    this.mountainsMergeGrouped = this.mountainAtomicContainer.selectAll(".vzb-mc-mountain.vzb-mc-aggrlevel1")
            .data(this.groupedPointers);
    this.mountainsAtomic = this.mountainAtomicContainer.selectAll(".vzb-mc-mountain.vzb-mc-aggrlevel0")
            .data(this.mountainPointers);

        //exit selection -- remove shapes
    this.mountainsMergeStacked.exit().remove();
    this.mountainsMergeGrouped.exit().remove();
    this.mountainsAtomic.exit().remove();

        //enter selection -- add shapes
    this.mountainsMergeStacked = this.mountainsMergeStacked.enter().append("path")
            .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel2")
            .merge(this.mountainsMergeStacked);
    this.mountainsMergeGrouped = this.mountainsMergeGrouped.enter().append("path")
            .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel1")
            .merge(this.mountainsMergeGrouped);
    this.mountainsAtomic = this.mountainsAtomic.enter().append("path")
            .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel0")
            .merge(this.mountainsAtomic);

        //add interaction
    this.mountains = this.mountainAtomicContainer.selectAll(".vzb-mc-mountain");

    this.mountains
      .on("mousemove", (d, i) => {
        if (utils.isTouchDevice()) return;
        _this._interact()._mousemove(d, i);
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
      });
  },

  _interact() {
    const _this = this;

    return {
      _mousemove(d, i) {
        if (_this.model.time.dragging || _this.model.time.playing) return;

        _this.model.marker.highlightMarker(d);

        const mouse = d3.mouse(_this.graph.node()).map(d => parseInt(d));

                //position tooltip
        _this._setTooltip(d.key ? _this.model.marker.color.getColorlegendMarker().label.getItems()[d.key] : _this.values.label[d.KEY()]);
        _this._selectlist.showCloseCross(d, true);

      },
      _mouseout(d, i) {
        if (_this.model.time.dragging || _this.model.time.playing) return;

        _this._setTooltip("");
        _this.model.marker.clearHighlighted();
        _this._selectlist.showCloseCross(d, false);

      },
      _click(d, i) {
        if (_this.model.time.dragging || _this.model.time.playing) return;

        _this.model.marker.selectMarker(d);
      }
    };

  },

  highlightMarkers() {
    const _this = this;
    this.someHighlighted = (this.model.marker.highlight.length > 0);

    if (!this.selectList || !this.someSelected) return;
    this.selectList.classed("vzb-highlight", d => _this.model.marker.isHighlighted(d));

  },

  selectMarkers() {
    const _this = this;
    this.someSelected = (this.model.marker.select.length > 0);

    this._selectlist.rebuild();
    this.nonSelectedOpacityZero = false;
  },

  _sumLeafPointersByMarker(branch, marker) {
    const _this = this;
    if (!branch.key) return _this.values[marker][branch.KEY()];
    return d3.sum(branch.values.map(m => _this._sumLeafPointersByMarker(m, marker)));
  },

  updateOpacity() {
    const _this = this;
        //if(!duration)duration = 0;

    const OPACITY_HIGHLT = 1.0;
    const OPACITY_HIGHLT_DIM = 0.3;
    const OPACITY_SELECT = this.model.marker.opacityRegular;
    const OPACITY_REGULAR = this.model.marker.opacityRegular;
    const OPACITY_SELECT_DIM = this.model.marker.opacitySelectDim;

    this.mountains.style("opacity", d => {

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

    this.mountains.classed("vzb-selected", d => _this.model.marker.isSelected(d));

    const nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < 0.01;

        // when pointer events need update...
    if (nonSelectedOpacityZero !== this.nonSelectedOpacityZero) {
      this.mountainsAtomic.style("pointer-events", d => (!_this.someSelected || !nonSelectedOpacityZero || _this.model.marker.isSelected(d)) ?
                    "visible" : "none");
    }

    this.nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < 0.01;
  },

  updateTime() {
    const _this = this;

    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;
    this.year.setText(this.model.time.formatDate(this.time), this.duration);
  },

  updatePointers() {
    const _this = this;
    this.yMax = 0;


        //spawn the original mountains
    this.mountainPointers.forEach((d, i) => {
      const vertices = _this._spawn(_this.values, d);
      _this.cached[d.KEY()] = vertices;
      d.hidden = vertices.length === 0;
    });


        //recalculate stacking
    if (_this.model.marker.stack.which !== "none") {
      this.stackedPointers.forEach(group => {
        let toStack = [];
        group.values.forEach(subgroup => {
          toStack = toStack.concat(subgroup.values.filter(f => !f.hidden));
        });
        _this.stack.keys(toStack.map(d => d.KEY()))(d3.range(_this.mesh.length))
          .forEach((vertices, keyIndex) => {
            const key = toStack[keyIndex].KEY();
            vertices.forEach((d, verticesIndex) => {
              _this.cached[key][verticesIndex].y0 = d[0];
            });
          });
      });
    }

    this.mountainPointers.forEach(d => {
      d.yMax = d3.max(_this.cached[d.KEY()].map(m => m.y0 + m.y));
      if (_this.yMax < d.yMax) _this.yMax = d.yMax;
    });

    const mergeGrouped = _this.model.marker.group.merge;
    const mergeStacked = _this.model.marker.stack.merge;
        //var dragOrPlay = (_this.model.time.dragging || _this.model.time.playing) && this.model.marker.stack.which !== "none";

        //if(mergeStacked){
    this.stackedPointers.forEach(d => {
      const firstLast = _this._getFirstLastPointersInStack(d);
      _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
      _this.values.color[d.key] = "_default";
      _this.values.axis_y[d.key] = _this._sumLeafPointersByMarker(d, "axis_y");
      d.yMax = firstLast.first.yMax;
    });
        //} else if (mergeGrouped || dragOrPlay){
    this.groupedPointers.forEach(d => {
      const firstLast = _this._getFirstLastPointersInStack(d);
      _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
      _this.values.color[d.key] = _this.values.color[firstLast.first.KEY()];
      _this.values.axis_y[d.key] = _this._sumLeafPointersByMarker(d, "axis_y");
      d.yMax = firstLast.first.yMax;
    });
        //}

    if (!mergeStacked && !mergeGrouped && this.model.marker.stack.use === "property") {
      this.groupedPointers.forEach(d => {
        const visible = d.values.filter(f => !f.hidden);
        d.yMax = visible[0].yMax;
        d.values.forEach(e => {
          e.yMaxGroup = d.yMax;
        });
      });
    }


  },

  _getFirstLastPointersInStack(group) {
    let visible, visible2;
    let first, last;

    if (group.values[0].values) {
      visible = group.values[0].values.filter(f => !f.hidden);
      visible2 = group.values[group.values.length - 1].values.filter(f => !f.hidden);
      first = visible[0];
      last = visible2[visible2.length - 1];
    } else {
      visible = group.values.filter(f => !f.hidden);
      first = visible[0];
      last = visible[visible.length - 1];
    }

    if (!visible.length || (visible2 && !visible2.length)) utils.warn("mountain chart failed to generate shapes. check the incoming data");

    return {
      first,
      last
    };
  },

  _getVerticesOfaMergedShape(arg) {
    const _this = this;

    const first = arg.first.KEY();
    const last = arg.last.KEY();

    return _this.mesh.map((m, i) => {
      const y = _this.cached[first][i].y0 + _this.cached[first][i].y - _this.cached[last][i].y0;
      const y0 = _this.cached[last][i].y0;
      return {
        x: m,
        y0,
        y
      };
    });
  },

  _spawnMasks() {
    const _this = this;

    const tailFatX = this._math.unscale(this.model.marker.axis_x.tailFatX);
    const tailCutX = this._math.unscale(this.model.marker.axis_x.tailCutX);
    const tailFade = this.model.marker.axis_x.tailFade;
    const k = 2 * Math.PI / (Math.log(tailFatX) - Math.log(tailCutX));
    const m = Math.PI - Math.log(tailFatX) * k;


    this.spawnMask = [];
    this.cosineShape = [];
    this.cosineArea = 0;

    this.mesh.forEach((dX, i) => {
      _this.spawnMask[i] = dX < tailCutX ? 1 : (dX > tailFade * 7 ? 0 : Math.exp((tailCutX - dX) / tailFade));
      _this.cosineShape[i] = (dX > tailCutX && dX < tailFatX ? (1 + Math.cos(Math.log(dX) * k + m)) : 0);
      _this.cosineArea += _this.cosineShape[i];
    });
  },

  _spawn(values, d) {
    const _this = this;

    const norm = values.axis_y[d.KEY()];
    const sigma = _this._math.giniToSigma(values.axis_s[d.KEY()]);
    const mu = _this._math.gdpToMu(values.axis_x[d.KEY()], sigma);

    if (!norm || !mu || !sigma) return [];

    const distribution = [];
    let acc = 0;

    this.mesh.forEach((dX, i) => {
      distribution[i] = _this._math.pdf.lognormal(dX, mu, sigma);
      acc += _this.spawnMask[i] * distribution[i];
    });

    const result = this.mesh.map((dX, i) => ({
      x: dX,
      y0: 0,
      y: norm * (distribution[i] * (1 - _this.spawnMask[i]) + _this.cosineShape[i] / _this.cosineArea * acc)
    }));

    return result;
  },

  _adjustMaxY(options) {
    if (!options) options = {};
    const _this = this;
    const method = this.model.ui.chart.yMaxMethod;

    if (method !== "immediate" && !options.force) return;
    if (method === "latest") {
      const prevValues = _this.values;
      _this.model.marker.getFrame(_this.model.time.end, values => {
        if (!values) return;

            //below is a complicated issue when updatePointers() is first calculated for one set of values (at the end of time series), then yMax is taken from that data (assuming that population always grows, so the last year has the highest mountain)
        _this.values = values;
        _this.updatePointers();

            //after that updatePointers() is called with the actual data of the current time point
        _this.values = prevValues;
        _this.yScale.domain([0, Math.round(_this.yMax)]);
        _this.updatePointers();
        _this.redrawDataPoints();
      });
    } else {
      if (!_this.yMax) utils.warn("Setting yMax to " + _this.yMax + ". You failed again :-/");
      _this.yScale.domain([0, Math.round(_this.yMax)]);
    }
  },

  redrawDataPoints() {
    const _this = this;
    const mergeGrouped = this.model.marker.group.merge;
    const mergeStacked = this.model.marker.stack.merge;
    const stackMode = this.model.marker.stack.which;
        //it's important to know if the chart is dragging or playing at the moment.
        //because if that is the case, the mountain chart will merge the stacked entities to save performance
    const dragOrPlay = (this.model.time.dragging || this.model.time.playing)
            //never merge when no entities are stacked
            && stackMode !== "none";

    this._adjustMaxY();

    this.mountainsMergeStacked.each(function(d) {
      const view = d3.select(this);
      const hidden = !mergeStacked;
      _this._renderShape(view, d.KEY(), hidden);
    });

    this.mountainsMergeGrouped.each(function(d) {
      const view = d3.select(this);
      const hidden = (!mergeGrouped && !dragOrPlay) || (mergeStacked && !_this.model.marker.isSelected(d));
      _this._renderShape(view, d.KEY(), hidden);
    });

    this.mountainsAtomic.each(function(d, i) {
      const view = d3.select(this);
      const hidden = d.hidden || ((mergeGrouped || mergeStacked || dragOrPlay) && !_this.model.marker.isSelected(d));
      _this._renderShape(view, d.KEY(), hidden);
    });

    if (stackMode === "none") {
      this.mountainsAtomic.sort((a, b) => b.yMax - a.yMax);

    } else if (stackMode === "all") {
            // do nothing if everything is stacked

    } else {
      if (mergeGrouped || dragOrPlay) {
                // this.mountainsMergeGrouped.sort(function (a, b) {
                //     return b.yMax - a.yMax;
                // });
      } else {
        this.mountainsAtomic.sort((a, b) => b.yMaxGroup - a.yMaxGroup);
      }
    }


        // exporting shapes for shape preloader. is needed once in a while
        // if (!this.shapes) this.shapes = {}
        // this.shapes[this.model.time.value.getUTCFullYear()] = {
        //     yMax: d3.format(".2e")(_this.yMax),
        //     shape: _this.cached["all"].map(function (d) {return d3.format(".2e")(d.y);})
        // }

  },

  redrawDataPointsOnlyColors() {
    const _this = this;
    if (!this.mountains) return utils.warn("redrawDataPointsOnlyColors(): no mountains  defined. likely a premature call, fix it!");
    const isColorUseIndicator = this.model.marker.color.use === "indicator";
    this.mountains.style("fill", d => _this.values.color[d.KEY()] ?
              (
                isColorUseIndicator && _this.values.color[d.KEY()] == "_default" ?
                 _this.model.marker.color.palette["_default"]
                 :
                 _this.cScale(_this.values.color[d.KEY()])
              )
            :
            COLOR_WHITEISH);
  },

  _renderShape(view, key, hidden) {
    const stack = this.model.marker.stack.which;
    const _this = this;

    view.classed("vzb-hidden", hidden);

    if (hidden) {
      if (stack !== "none") view.style("stroke-opacity", 0);
      return;
    }

    const filter = {};
    filter[this.KEY] = key;
    if (this.model.marker.isSelected(filter)) {
      view.attr("d", this.area(this.cached[key].filter(f => f.y > _this.values.axis_y[key] * THICKNESS_THRESHOLD)));
    } else {
      view.attr("d", this.area(this.cached[key]));
    }

        //color use indicator suggests that this should be updated on every timeframe
    if (this.model.marker.color.use === "indicator") {
      view.style("fill", _this.values.color[key] ?
            (
             _this.values.color[key] !== "_default" ?
               _this.cScale(_this.values.color[key])
               :
               _this.model.marker.color.palette["_default"]
            )
            :
            COLOR_WHITEISH
          );
    }

    if (stack !== "none") view
      .transition().duration(Math.random() * 900 + 100).ease(d3.easeCircle)
      .style("stroke-opacity", 0.5);

    if (this.model.time.record) this._export.write({
      type: "path",
      id: key,
      time: this.model.time.value.getUTCFullYear(),
      fill: this.cScale(this.values.color[key]),
      d: this.area(this.cached[key])
    });
  },

  _setTooltip(tooltipText) {
    if (tooltipText) {
      const mouse = d3.mouse(this.graph.node()).map(d => parseInt(d));

            //position tooltip
      this.tooltip.classed("vzb-hidden", false)
        .attr("transform", "translate(" + (mouse[0]) + "," + (mouse[1]) + ")")
        .selectAll("text")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .text(tooltipText);

      const contentBBox = this.tooltip.select("text").node().getBBox();

      this.tooltip.select("rect")
        .attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height + 8)
        .attr("x", -contentBBox.width - 25)
        .attr("y", -contentBBox.height - 25)
        .attr("rx", contentBBox.height * 0.2)
        .attr("ry", contentBBox.height * 0.2);

      this.tooltip.selectAll("text")
        .attr("x", -contentBBox.width - 25 + ((contentBBox.width + 8) / 2))
        .attr("y", -contentBBox.height - 25 + ((contentBBox.height + 11) / 2)); // 11 is 8 for margin + 3 for strokes
      const translateX = (mouse[0] - contentBBox.width - 25) > 0 ? mouse[0] : (contentBBox.width + 25);
      const translateY = (mouse[1] - contentBBox.height - 25) > 0 ? mouse[1] : (contentBBox.height + 25);
      this.tooltip
        .attr("transform", "translate(" + translateX + "," + translateY + ")");

    } else {

      this.tooltip.classed("vzb-hidden", true);
    }
  },

  preload() {
    const shape_path = globals.ext_resources.shapePath ? globals.ext_resources.shapePath :
          globals.ext_resources.host + globals.ext_resources.preloadPath + "mc_precomputed_shapes.json";

    const _this = this;

    return new Promise((resolve, reject) => {

      d3.json(shape_path, (error, json) => {
        if (error) return console.warn("Failed loading json " + shape_path + ". " + error);
        _this.precomputedShapes = json;
        resolve();
      });

    });
  }

});

export default MountainChartComponent;
