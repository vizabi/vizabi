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

import * as utils from 'base/utils';
import globals from 'base/globals';
import Component from 'base/component';
import { warn as iconWarn, question as iconQuestion } from 'base/iconset';

import Exporter from 'helpers/svgexport';
import axisSmart from 'helpers/d3.axisWithLabelPicker';
import MountainChartMath from './mountainchart-math';
import Selectlist from './mountainchart-selectlist';
import Probe from './mountainchart-probe';
import DynamicBackground from 'helpers/d3.dynamicBackground';

var THICKNESS_THRESHOLD = 0.001;

//MOUNTAIN CHART COMPONENT
var MountainChartComponent = Component.extend({

    /**
     * Initialize the component
     * Executed once before any template is rendered.
     * @param {Object} config The options passed to the component
     * @param {Object} context The component's parent
     */
    init: function (config, context) {

        var _this = this;
        this.name = "mountainchart";
        this.template = "mountainchart.html";

        //define expected models for this component
        this.model_expects = [
            { name: "time", type: "time" },
            { name: "entities", type: "entities" },
            { name: "marker", type: "model" },
            { name: "language", type: "language" }
        ];

        //attach event listeners to the model items
        this.model_binds = {
            "change:time:value": function (evt) {
                //console.log("MONT: " + evt);
                _this.updateTime();
                _this.redrawDataPoints();
                _this._selectlist.redraw();
                _this._probe.redraw();
                _this.updateDoubtOpacity();
            },
            "change:time:xScaleFactor": function () {
                _this.ready();
            },
            "change:time:xScaleShift": function () {
                _this.ready();
            },
            "change:time:tailCutX": function () {
                _this.ready();
            },
            "change:time:tailFade": function () {
                _this.ready();
            },
            "change:time:probeX": function () {
                _this.ready();
            },
            "change:time:xPoints": function () {
                _this.ready();
            },
            "change:time:xLogStops": function () {
                _this.updateSize();
            },
            "change:time:yMaxMethod": function () {
                _this._adjustMaxY({ force: true });
                _this.redrawDataPoints();
            },
            "change:time:record": function (evt) {
                if (_this.model.time.record) {
                    _this._export.open(this.element, this.name);
                } else {
                    _this._export.reset();
                }
            },
            "change:entities:highlight": function (evt) {
                if (!_this._readyOnce) return;
                _this.highlightEntities();
                _this.updateOpacity();
            },
            "change:entities:select": function (evt) {
                if (!_this._readyOnce) return;
                _this.selectEntities();
                _this._selectlist.redraw();
                _this.updateOpacity();
                _this.updateDoubtOpacity();
                _this.redrawDataPoints();
            },
            "change:entities:opacitySelectDim": function (evt) {
                _this.updateOpacity();
            },
            "change:entities:opacityRegular": function (evt) {
                _this.updateOpacity();
            },
            "change:marker": function (evt) {
                if (!_this._readyOnce) return;
                if (evt.indexOf("fakeMin") > -1 || evt.indexOf("fakeMax") > -1) {
                    _this.zoomToMaxMin();
                    _this.redrawDataPoints();
                    _this._probe.redraw();
                }
            },
            "change:marker:group": function (evt) {
                if (!_this._readyOnce) return;
                if (evt.indexOf("group:merge") > -1) return;
                _this.ready();
            },
            "change:marker:group:merge": function (evt) {
                if (!_this._readyOnce) return;
                _this.updateTime();
                _this.redrawDataPoints();
            },
            "change:marker:stack": function (evt) {
                if (!_this._readyOnce) return;
                _this.ready();
            },
            "change:marker:color:palette": function (evt) {
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
        this.area = d3.svg.area()
            .interpolate("basis")
            .x(function (d) {
                return _this.xScale(_this._math.rescale(d.x));
            })
            .y0(function (d) {
                return _this.yScale(d.y0);
            })
            .y1(function (d) {
                return _this.yScale(d.y0 + d.y);
            });

        //define d3 stack layout
        this.stack = d3.layout.stack()
            .order("reverse")
            .values(function (d) {
                return _this.cached[d.KEY()];
            })
            .out(function out(d, y0, y) {
                d.y0 = y0;
            });

        // init internal variables
        this.xScale = null;
        this.yScale = null;
        this.cScale = null;

        this.xAxis = axisSmart();


        this.rangeRatio = 1;
        this.rangeShift = 0;
        this.cached = {};
        this.mesh = [];
        this.yMax = 0;
    },

    domReady: function () {
        var _this = this;

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
            .onTap(function (d, i) {
                _this._interact()._mouseout(d, i);
            });
    },

    afterPreload: function () {
        var _this = this;

        var yearNow = _this.model.time.value.getFullYear();
        var yearEnd = _this.model.time.end.getFullYear();

        this._math.xScaleFactor = this.model.time.xScaleFactor;
        this._math.xScaleShift = this.model.time.xScaleShift;

        if (!this.precomputedShapes || !this.precomputedShapes[yearNow] || !this.precomputedShapes[yearEnd]) return;

        var yMax = this.precomputedShapes[this.model.time.yMaxMethod == "immediate" ? yearNow : yearEnd].yMax;
        var shape = this.precomputedShapes[yearNow].shape;

        if (!yMax || !shape || shape.length === 0) return;

        this.xScale = d3.scale.log().domain([this.model.marker.axis_x.min, this.model.marker.axis_x.max]);
        this.yScale = d3.scale.linear().domain([0, +yMax]);

        _this.updateSize(shape.length);
        _this.zoomToMaxMin();

        shape = shape.map(function (m, i) {return {x: _this.mesh[i], y0: 0, y: +m};})

        this.mountainAtomicContainer.selectAll(".vzb-mc-prerender")
            .data([0])
            .enter().append("path")
            .attr("class", "vzb-mc-prerender")
            .style("fill", "pink")
            .style("opacity", 0)
            .attr("d", _this.area(shape))
            .transition().duration(1000).ease("linear")
            .style("opacity", 1);
    },

    readyOnce: function () {

        this.eventAreaEl
            .on("mousemove", function () {
                if (_this.model.time.dragging) return;
                _this._probe.redraw({
                    level: _this.xScale.invert(d3.mouse(this)[0]),
                    full: true
                });
            })
            .on("mouseout", function () {
                if (_this.model.time.dragging) return;
                _this._probe.redraw();
            });

        var _this = this;
        this.on("resize", function () {
            //console.log("acting on resize");
            _this.updateSize();
            _this.updateTime(); // respawn is needed
            _this.redrawDataPoints();
            _this._selectlist.redraw();
            _this._probe.redraw();
        });

        this.KEY = this.model.entities.getDimension();
        this.TIMEDIM = this.model.time.getDimension();

        this.mountainAtomicContainer.select(".vzb-mc-prerender").remove();

        this.wScale = d3.scale.linear()
            .domain(this.parent.datawarning_content.doubtDomain)
            .range(this.parent.datawarning_content.doubtRange);
    },

    ready: function () {
        //console.log("ready")

        this._math.xScaleFactor = this.model.time.xScaleFactor;
        this._math.xScaleShift = this.model.time.xScaleShift;

        this.updateUIStrings();
        this.updateIndicators();
        this.updateEntities();
        this.updateSize();
        this.zoomToMaxMin();
        this._spawnMasks();
        this.updateTime();
        this._adjustMaxY({force: true});
        this.redrawDataPoints();
        this.redrawDataPointsOnlyColors();
        this.highlightEntities();
        this.selectEntities();
        this._selectlist.redraw();
        this.updateOpacity();
        this.updateDoubtOpacity();
        this._probe.redraw();
    },

    updateSize: function (meshLength) {

        var margin, infoElHeight;
        var padding = 2;

        var profiles = {
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

        var presentationProfileChanges = {
          small: {
            margin: { top: 10, right: 10, left: 10, bottom: 30 },
            infoElHeight: 16
          },
          medium: {
            margin: { top: 20, right: 20, left: 20, bottom: 50 },
            infoElHeight: 20
          },
          large: {
            margin: { top: 30, right: 30, left: 30, bottom: 50 },
            infoElHeight: 22
          }
        };

        this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);
        margin = this.activeProfile.margin;
        infoElHeight = this.activeProfile.infoElHeight;

        //mesure width and height
        this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
        this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

        //graph group is shifted according to margins (while svg element is at 100 by 100%)
        this.graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var yearLabelOptions = {
            topOffset: this.getLayoutProfile()==="large"? margin.top * 2 : 0,
            xAlign: this.getLayoutProfile()==="large"? 'right' : 'center',
            yAlign: this.getLayoutProfile()==="large"? 'top' : 'center',
        };

        var yearLabelFontSize = this.getLayoutProfile()==="large"? this.width / 6 : Math.max(this.height / 4, this.width / 4);

        //year is centered and resized
        this.year
            .setConditions(yearLabelOptions)
            .resize(this.width, this.height, yearLabelFontSize);

        //update scales to the new range
        this.yScale.range([this.height, 0]);
        this.xScale.range([this.rangeShift, this.width * this.rangeRatio + this.rangeShift]);


        //need to know scale type of X to move on
        var scaleType = this._readyOnce ? this.model.marker.axis_x.scaleType : "log";

        //axis is updated
        this.xAxis.scale(this.xScale)
            .orient("bottom")
            .tickSize(6, 0)
            .tickSizeMinor(3, 0)
            .labelerOptions({
                scaleType: scaleType,
                toolMargin: margin,
                pivotingLimit: margin.bottom * 1.5,
                method: this.xAxis.METHOD_REPEATING,
                stops: this._readyOnce ? this.model.time.xLogStops : [1]
            });


        this.xAxisEl
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis);

        this.xTitleEl.select("text")
            .attr("transform", "translate(" + this.width + "," + this.height + ")")
            .attr("dy", "-0.36em");

        this.yTitleEl
          .style("font-size", infoElHeight)
          .attr("transform", "translate(0," + margin.top + ")")


        var warnBB = this.dataWarningEl.select("text").node().getBBox();
        this.dataWarningEl.select("svg")
            .attr("width", warnBB.height)
            .attr("height", warnBB.height)
            .attr("x", warnBB.height * .1)
            .attr("y", -warnBB.height * 1.0 + 1)

        this.dataWarningEl
            .attr("transform", "translate(" + (0) + "," + (margin.top + warnBB.height * 1.5) + ")")
            .select("text")
            .attr("dx", warnBB.height * 1.5);

        if(this.infoEl.select('svg').node()) {
            var titleBBox = this.yTitleEl.node().getBBox();
            var translate = d3.transform(this.yTitleEl.attr('transform')).translate;

            this.infoEl.select('svg')
                .attr("width", infoElHeight)
                .attr("height", infoElHeight)
            this.infoEl.attr('transform', 'translate('
                + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
                + (translate[1]-infoElHeight * .8) + ')');
        }

        this.eventAreaEl
            .attr("y", this.height)
            .attr("width", this.width)
            .attr("height", margin.bottom);

        if (!meshLength) meshLength = this.model.time.xPoints;
        this.mesh = this._math.generateMesh(meshLength, scaleType, this.xScale.domain());
    },


    zoomToMaxMin: function(){
        var _this = this;

        if(this.model.marker.axis_x.fakeMin==null || this.model.marker.axis_x.fakeMax==null) return;

        var x1 = this.xScale(this.model.marker.axis_x.fakeMin);
        var x2 = this.xScale(this.model.marker.axis_x.fakeMax);

        this.rangeRatio = this.width / (x2 - x1) * this.rangeRatio;
        this.rangeShift = (this.rangeShift - x1) / (x2 - x1) * this.width;

        this.xScale.range([this.rangeShift, this.width*this.rangeRatio + this.rangeShift]);

        this.xAxisEl.call(this.xAxis);
    },


    updateUIStrings: function () {
        var _this = this;

        this.translator = this.model.language.getTFunction();
        var xMetadata = globals.metadata.indicatorsDB[this.model.marker.axis_x.which];


        this.xTitleEl.select("text")
            .text(this.translator("unit/mountainchart_hardcoded_income_per_day"));

        this.yTitleEl.select("text")
            .text(this.translator("mount/title"));

        utils.setIcon(this.dataWarningEl, iconWarn).select("svg").attr("width", "0px").attr("height", "0px");
        this.dataWarningEl.append("text")
            .text(this.translator("hints/dataWarning"));

        utils.setIcon(this.infoEl, iconQuestion).select("svg").attr("width", "0px").attr("height", "0px");

        //TODO: move away from UI strings, maybe to ready or ready once
        this.infoEl.on("click", function () {
            window.open(xMetadata.sourceLink, "_blank").focus();
        })
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
    },

    updateDoubtOpacity: function (opacity) {
        if (opacity == null) opacity = this.wScale(+this.time.getFullYear().toString());
        if (this.someSelected) opacity = 1;
        this.dataWarningEl.style("opacity", opacity);
    },

    updateIndicators: function () {
        var _this = this;

        //fetch scales, or rebuild scales if there are none, then fetch
        this.yScale = this.model.marker.axis_y.getScale();
        this.xScale = this.model.marker.axis_x.getScale();
        this.cScale = this.model.marker.color.getScale();

        this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
    },

    updateEntities: function () {
        var _this = this;

        var filter = {};
        filter[_this.TIMEDIM] = this.model.time.end;
        this.values = this.model.marker.getValues(filter, [_this.KEY]);

        // construct pointers
        this.mountainPointers = this.model.marker.getKeys()
            .map(function (d) {
                var pointer = {};
                pointer[_this.KEY] = d[_this.KEY];
                pointer.KEY = function () {
                    return this[_this.KEY];
                };
                pointer.sortValue = [_this.values.axis_y[pointer.KEY()], 0];
                pointer.aggrLevel = 0;
                return pointer;
            });


        //TODO: optimise this!
        this.groupedPointers = d3.nest()
            .key(function (d) {
                return _this.model.marker.stack.use === "property" ? _this.values.stack[d.KEY()] : _this.values.group[d.KEY()];
            })
            .sortValues(function (a, b) {
                return b.sortValue[0] - a.sortValue[0];
            })
            .entries(this.mountainPointers);


        var groupManualSort = this.model.marker.group.manualSorting;
        this.groupedPointers.forEach(function (group) {
            var groupSortValue = d3.sum(group.values.map(function (m) {
                return m.sortValue[0];
            }));

            if (groupManualSort && groupManualSort.length > 1) groupSortValue = groupManualSort.indexOf(group.key);

            group.values.forEach(function (d) {
                d.sortValue[1] = groupSortValue;
            });

            group[_this.model.entities.getDimension()] = group.key; // hack to get highlihgt and selection work
            group.KEY = function () {
                return this.key;
            };
            group.aggrLevel = 1;
        });

        var sortGroupKeys = {};
        _this.groupedPointers.map(function (m) {
            sortGroupKeys[m.key] = m.values[0].sortValue[1];
        });


        // update the stacked pointers
        if (_this.model.marker.stack.which === "none") {
            this.stackedPointers = [];
            this.mountainPointers.sort(function (a, b) {
                return b.sortValue[0] - a.sortValue[0];
            });

        } else {
            this.stackedPointers = d3.nest()
                .key(function (d) {
                    return _this.values.stack[d.KEY()];
                })
                .key(function (d) {
                    return _this.values.group[d.KEY()];
                })
                .sortKeys(function (a, b) {
                    return sortGroupKeys[b] - sortGroupKeys[a];
                })
                .sortValues(function (a, b) {
                    return b.sortValue[0] - a.sortValue[0];
                })
                .entries(this.mountainPointers);

            this.mountainPointers.sort(function (a, b) {
                return b.sortValue[1] - a.sortValue[1];
            });


            this.stackedPointers.forEach(function (stack) {
                stack.KEY = function () {
                    return this.key;
                };
                stack[_this.model.entities.getDimension()] = stack.key; // hack to get highlihgt and selection work
                stack.aggrLevel = 2;
            });
        }

        //console.log(JSON.stringify(this.mountainPointers.map(function(m){return m.geo})))
        //console.log(this.stackedPointers)


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
        this.mountainsMergeStacked.enter().append("path")
            .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel2");
        this.mountainsMergeGrouped.enter().append("path")
            .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel1");
        this.mountainsAtomic.enter().append("path")
            .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel0");

        //add interaction
        this.mountains = this.mountainAtomicContainer.selectAll(".vzb-mc-mountain");

        this.mountains
            .on("mousemove", function (d, i) {
                if (utils.isTouchDevice()) return;
                _this._interact()._mousemove(d, i);
            })
            .on("mouseout", function (d, i) {
                if (utils.isTouchDevice()) return;
                _this._interact()._mouseout(d, i);
            })
            .on("click", function (d, i) {
                if (utils.isTouchDevice()) return;
                _this._interact()._click(d, i);
                _this.highlightEntities();
            })
            .onTap(function (d, i) {
                _this._interact()._click(d, i);
                d3.event.stopPropagation();
            })
            .onLongTap(function (d, i) {
            })
    },

    _interact: function () {
        var _this = this;

        return {
            _mousemove: function (d, i) {
                if (_this.model.time.dragging) return;

                _this.model.entities.highlightEntity(d);

                var mouse = d3.mouse(_this.graph.node()).map(function (d) {
                    return parseInt(d);
                });

                //position tooltip
                _this._setTooltip(d.key ? _this.translator("region/" + d.key) : _this.model.marker.label.getValue(d));

            },
            _mouseout: function (d, i) {
                if (_this.model.time.dragging) return;

                _this._setTooltip("");
                _this.model.entities.clearHighlighted();
            },
            _click: function (d, i) {
                _this.model.entities.selectEntity(d);
            }
        };

    },

    highlightEntities: function () {
        var _this = this;
        this.someHighlighted = (this.model.entities.highlight.length > 0);

        if (!this.selectList || !this.someSelected) return;
        this.selectList.classed("vzb-highlight", function (d) {
            return _this.model.entities.isHighlighted(d);
        });
        this.selectList.each(function (d, i) {
          d3.select(this).selectAll(".vzb-mc-label-x")
            .classed("vzb-invisible", function(n) {
              return !_this.model.entities.isHighlighted(d);
            });

        });

    },

    selectEntities: function () {
        var _this = this;
        this.someSelected = (this.model.entities.select.length > 0);

        this._selectlist.rebuild();
    },

    _sumLeafPointersByMarker: function (branch, marker) {
        var _this = this;
        if (!branch.key) return _this.values[marker][branch.KEY()];
        return d3.sum(branch.values.map(function (m) {
            return _this._sumLeafPointersByMarker(m, marker);
        }));
    },

    updateOpacity: function () {
        var _this = this;
        //if(!duration)duration = 0;

        var OPACITY_HIGHLT = 1.0;
        var OPACITY_HIGHLT_DIM = .3;
        var OPACITY_SELECT = 1.0;
        var OPACITY_REGULAR = this.model.entities.opacityRegular;
        var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

        this.mountains.style("opacity", function (d) {

            if (_this.someHighlighted) {
                //highlight or non-highlight
                if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
            }

            if (_this.someSelected) {
                //selected or non-selected
                return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
            }

            if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

            return OPACITY_REGULAR;

        });

        this.mountains.classed("vzb-selected", function (d) {
            return _this.model.entities.isSelected(d)
        });

        var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < .01;

        // when pointer events need update...
        if (someSelectedAndOpacityZero !== this.someSelectedAndOpacityZero_1) {
            this.mountainsAtomic.style("pointer-events", function (d) {
                return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                    "visible" : "none";
            });
        }

        this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < .01;
    },

    updateTime: function (time) {
        var _this = this;

        this.time = this.model.time.value;
        if (time == null) time = this.time;

        this.year.setText(time.getFullYear().toString());

        var filter = {};
        filter[_this.TIMEDIM] = time;
        this.values = this.model.marker.getValues(filter, [_this.KEY]);
        this.yMax = 0;


        //spawn the original mountains
        this.mountainPointers.forEach(function (d, i) {
            var vertices = _this._spawn(_this.values, d);
            _this.cached[d.KEY()] = vertices;
            d.hidden = vertices.length === 0;
        });


        //recalculate stacking
        if (_this.model.marker.stack.which !== "none") {
            this.stackedPointers.forEach(function (group) {
                var toStack = [];
                group.values.forEach(function (subgroup) {
                    toStack = toStack.concat(subgroup.values.filter(function (f) {
                        return !f.hidden;
                    }));
                });
                _this.stack(toStack);
            });
        }

        this.mountainPointers.forEach(function (d) {
            d.yMax = d3.max(_this.cached[d.KEY()].map(function (m) {
                return m.y0 + m.y;
            }));
            if (_this.yMax < d.yMax) _this.yMax = d.yMax;
        });

        var mergeGrouped = _this.model.marker.group.merge;
        var mergeStacked = _this.model.marker.stack.merge;
        var dragOrPlay = (_this.model.time.dragging || _this.model.time.playing) && this.model.marker.stack.which !== "none";

        //if(mergeStacked){
        this.stackedPointers.forEach(function (d) {
            var firstLast = _this._getFirstLastPointersInStack(d);
            _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
            _this.values.color[d.key] = "_default";
            _this.values.axis_y[d.key] = _this._sumLeafPointersByMarker(d, "axis_y");
            d.yMax = firstLast.first.yMax;
        });
        //} else if (mergeGrouped || dragOrPlay){
        this.groupedPointers.forEach(function (d) {
            var firstLast = _this._getFirstLastPointersInStack(d);
            _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
            _this.values.color[d.key] = _this.values.color[firstLast.first.KEY()];
            _this.values.axis_y[d.key] = _this._sumLeafPointersByMarker(d, "axis_y");
            d.yMax = firstLast.first.yMax;
        });
        //}

        if (!mergeStacked && !mergeGrouped && this.model.marker.stack.use === "property") {
            this.groupedPointers.forEach(function (d) {
                var visible = d.values.filter(function (f) {
                    return !f.hidden;
                });
                d.yMax = visible[0].yMax;
                d.values.forEach(function (e) {
                    e.yMaxGroup = d.yMax;
                });
            });
        }


    },

    _getFirstLastPointersInStack: function (group) {
        var _this = this;

        var visible, visible2;

        if (group.values[0].values) {
            visible = group.values[0].values.filter(function (f) {
                return !f.hidden;
            });
            visible2 = group.values[group.values.length - 1].values.filter(function (f) {
                return !f.hidden;
            });
            var first = visible[0];
            var last = visible2[visible2.length - 1];
        } else {
            visible = group.values.filter(function (f) {
                return !f.hidden;
            });
            var first = visible[0];
            var last = visible[visible.length - 1];
        }

        return {
            first: first,
            last: last
        };
    },

    _getVerticesOfaMergedShape: function (arg) {
        var _this = this;

        var first = arg.first.KEY();
        var last = arg.last.KEY();

        return _this.mesh.map(function (m, i) {
            var y = _this.cached[first][i].y0 + _this.cached[first][i].y - _this.cached[last][i].y0;
            var y0 = _this.cached[last][i].y0;
            return {
                x: m,
                y0: y0,
                y: y
            };
        });
    },

    _spawnMasks: function () {
        var _this = this;

        var tailFatX = this._math.unscale(this.model.time.tailFatX);
        var tailCutX = this._math.unscale(this.model.time.tailCutX);
        var tailFade = this.model.time.tailFade;
        var k = 2 * Math.PI / (Math.log(tailFatX) - Math.log(tailCutX));
        var m = Math.PI - Math.log(tailFatX) * k;


        this.spawnMask = [];
        this.cosineShape = [];
        this.cosineArea = 0;

        this.mesh.map(function (dX, i) {
            _this.spawnMask[i] = dX < tailCutX ? 1 : (dX > tailFade * 7 ? 0 : Math.exp((tailCutX - dX) / tailFade))
            _this.cosineShape[i] = (dX > tailCutX && dX < tailFatX ? (1 + Math.cos(Math.log(dX) * k + m)) : 0);
            _this.cosineArea += _this.cosineShape[i];
        });
    },

    _spawn: function (values, d) {
        var _this = this;

        var norm = values.axis_y[d.KEY()];
        var sigma = _this._math.giniToSigma(values.size[d.KEY()]);
        var mu = _this._math.gdpToMu(values.axis_x[d.KEY()], sigma);

        if (!norm || !mu || !sigma) return [];

        var distribution = [];
        var acc = 0;

        this.mesh.map(function (dX, i) {
            distribution[i] = _this._math.pdf.lognormal(dX, mu, sigma);
            acc += _this.spawnMask[i] * distribution[i];
        });

        var result = this.mesh.map(function (dX, i) {
            return {
                x: dX,
                y0: 0,
                y: norm * (distribution[i] * (1 - _this.spawnMask[i]) + _this.cosineShape[i] / _this.cosineArea * acc)
            }
        });

        return result;
    },

    _adjustMaxY: function (options) {
        if (!options) options = {};
        var _this = this;
        var method = this.model.time.yMaxMethod;

        if (method !== "immediate" && !options.force) return;

        if (method === "latest") _this.updateTime(_this.model.time.end);

        if (!_this.yMax) utils.warn("Setting yMax to " + _this.yMax + ". You failed again :-/");
        this.yScale.domain([0, _this.yMax]);

        if (method === "latest") _this.updateTime();
    },

    redrawDataPoints: function () {
        var _this = this;
        var mergeGrouped = this.model.marker.group.merge;
        var mergeStacked = this.model.marker.stack.merge;
        var stackMode = this.model.marker.stack.which;
        //it's important to know if the chart is dragging or playing at the moment.
        //because if that is the case, the mountain chart will merge the stacked entities to save performance
        var dragOrPlay = (this.model.time.dragging || this.model.time.playing)
            //never merge when no entities are stacked
            && stackMode !== "none"
            //when the time is playing and stops in the end, the time.playing is set to false after the slider is stopped
            //so the mountain chat is stuck in the merged state. this line prevents it:
            && !(this.model.time.value - this.model.time.end==0 && !this.model.time.loop);

        this._adjustMaxY();

        this.mountainsMergeStacked.each(function (d) {
            var view = d3.select(this);
            var hidden = !mergeStacked;
            _this._renderShape(view, d.KEY(), hidden);
        })

        this.mountainsMergeGrouped.each(function (d) {
            var view = d3.select(this);
            var hidden = (!mergeGrouped && !dragOrPlay) || (mergeStacked && !_this.model.entities.isSelected(d));
            _this._renderShape(view, d.KEY(), hidden);
        });

        this.mountainsAtomic.each(function (d, i) {
            var view = d3.select(this);
            var hidden = d.hidden || ((mergeGrouped || mergeStacked || dragOrPlay) && !_this.model.entities.isSelected(d));
            _this._renderShape(view, d.KEY(), hidden);
        })

        if (stackMode === "none") {
            this.mountainsAtomic.sort(function (a, b) {
                return b.yMax - a.yMax;
            });

        } else if (stackMode === "all") {
            // do nothing if everything is stacked

        } else {
            if (mergeGrouped || dragOrPlay) {
                this.mountainsMergeGrouped.sort(function (a, b) {
                    return b.yMax - a.yMax;
                });
            } else {
                this.mountainsAtomic.sort(function (a, b) {
                    return b.yMaxGroup - a.yMaxGroup;
                });
            }
        }


        // exporting shapes for shape preloader. is needed once in a while
        // if (!this.shapes) this.shapes = {}
        // this.shapes[this.model.time.value.getFullYear()] = {
        //     yMax: d3.format(".2e")(_this.yMax),
        //     shape: _this.cached["all"].map(function (d) {return d3.format(".2e")(d.y);})
        // }

    },

    redrawDataPointsOnlyColors: function () {
        var _this = this;
        this.mountains.style("fill", function (d) {
            return _this.cScale(_this.values.color[d.KEY()]);
        });
    },

    _renderShape: function (view, key, hidden) {
        var stack = this.model.marker.stack.which;
        var _this = this;

        view.classed("vzb-hidden", hidden);

        if (hidden) {
            if (stack !== "none") view.style("stroke-opacity", 0);
            return;
        }

        var filter = {};
        filter[this.KEY] = key;
        if (this.model.entities.isSelected(filter)) {
            view.attr("d", this.area(this.cached[key].filter(function (f) {return f.y > _this.values.axis_y[key] * THICKNESS_THRESHOLD })));
        } else {
            view.attr("d", this.area(this.cached[key]));
        }

        if (this.model.marker.color.use === "indicator") view
            .style("fill", this.cScale(this.values.color[key]));

        if (stack !== "none") view
            .transition().duration(Math.random() * 900 + 100).ease("circle")
            .style("stroke-opacity", .5);

        if (this.model.time.record) this._export.write({
            type: "path",
            id: key,
            time: this.model.time.value.getFullYear(),
            fill: this.cScale(this.values.color[key]),
            d: this.area(this.cached[key])
        });
    },

    _setTooltip: function (tooltipText) {
        if (tooltipText) {
            var mouse = d3.mouse(this.graph.node()).map(function (d) { return parseInt(d); });

            //position tooltip
            this.tooltip.classed("vzb-hidden", false)
                .attr("transform", "translate(" + (mouse[0]) + "," + (mouse[1]) + ")")
                .selectAll("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .text(tooltipText)

            var contentBBox = this.tooltip.select("text")[0][0].getBBox();

            this.tooltip.select("rect")
                .attr("width", contentBBox.width + 8)
                .attr("height", contentBBox.height + 8)
                .attr("x", -contentBBox.width - 25)
                .attr("y", -contentBBox.height - 25)
                .attr("rx", contentBBox.height * .2)
                .attr("ry", contentBBox.height * .2);

            this.tooltip.selectAll("text")
                .attr("x", -contentBBox.width - 25 + ((contentBBox.width + 8)/2))
                .attr("y", -contentBBox.height - 25 + ((contentBBox.height + 11)/2)); // 11 is 8 for margin + 3 for strokes
            var translateX = (mouse[0] - contentBBox.width - 25) > 0 ? mouse[0] : (contentBBox.width + 25);
            var translateY = (mouse[1] - contentBBox.height - 25) > 0 ? mouse[1] : (contentBBox.height + 25);
            this.tooltip
                .attr("transform", "translate(" + translateX + "," + translateY + ")");

        } else {

            this.tooltip.classed("vzb-hidden", true);
        }
    }


});

export default MountainChartComponent;
