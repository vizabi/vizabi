/*!
 * VIZABI MOUNTAINCHART
 */

(function () {

    'use strict';

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var iconset = Vizabi.iconset;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;




    //MOUNTAIN CHART COMPONENT
    Vizabi.Component.extend('gapminder-mountainchart', {

        /**
         * Initializes the component (Mountain Chart).
         * Executed once before any template is rendered.
         * @param {Object} config The options passed to the component
         * @param {Object} context The component's parent
         */
        init: function (config, context) {

            var _this = this;
            this.name = 'mountainchart';
            this.template = 'src/tools/mountainchart/mountainchart.html';

            //define expected models for this component
            this.model_expects = [
                { name: 'time', type: 'time' },
                { name: 'entities', type: 'entities' },
                { name: 'marker', type: 'model' },
                { name: 'language', type: 'language' }
            ];

            this.model_binds = {
                'change': function (evt) {
                    if (!_this._readyOnce) return;
                    if (evt.indexOf('change:time') !== -1) return;
                    //console.log('change', evt);
                },
                'change:marker:color:palette': utils.debounce(function (evt) {
                    _this.redrawDataPoints();
                    _this.redrawDataPointsOnlyColors();
                    _this.redrawSelectList();
                }, 200),
                'change:time:value': function () {
                    //console.log('change time value');
                    _this.updateTime();
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:povertyCutoff': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:gdpFactor': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:gdpShift': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:povertyFade': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:xPoints': function () {
                    //console.log('acting on resize');
                    _this.ready();
                },
                'change:time:record': function () {
                    //console.log('change time record');
                    if (_this.model.time.record) {
                        _this._export.open(this.element, this.name);
                    } else {
                        _this._export.reset();
                    }
                },
                'change:time:xLogStops': function () {
                    _this.updateSize();
                },
                'change:entities:highlight': function () {
                    if (!_this._readyOnce) return;
                    //console.log('EVENT change:entities:highlight');
                    _this.highlightEntities();
                    _this.updateOpacity();
                },
                'change:entities:select': function () {
                    if (!_this._readyOnce) return;
                    //console.log('EVENT change:entities:select');
                    _this.selectEntities();
                    _this.redrawSelectList();
                    _this.updateOpacity();
                    _this.redrawDataPoints();
                },
                'change:time:yMaxMethod': function () {
                    _this._adjustMaxY({force: true});
                    _this.redrawDataPoints();
                },
                'change:time:povertyline': function () {
                    _this.ready();
                },
                'change:marker': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log('EVENT change:marker', evt);
                    if (evt.indexOf('min') > -1 || evt.indexOf('max') > -1) {
                        _this.updateSize();
                        _this.updateTime();
                        _this._adjustMaxY({
                            force: true
                        });
                        _this.redrawDataPoints();
                    }
                },
                'change:marker:group': function (evt) {
                    if (!_this._readyOnce) return;
                    if (evt === 'change:marker:group:merge') return;
                    //console.log('group event')
                    _this.ready();
                },

                'change:marker:group:merge': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log('group merge event')
                    _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:marker:stack': function (evt) {
                    if (!_this._readyOnce) return;
                    _this.ready();
                },
                'change:entities:opacitySelectDim': function () {
                    _this.updateOpacity();
                },
                'change:entities:opacityRegular': function () {
                    _this.updateOpacity();
                }
            };



            this._super(config, context);

            var MountainChartMath = Vizabi.Helper.get('gapminder-mountainchart-math');
            var Exporter = Vizabi.Helper.get('gapminder-svgexport');
            this._math = new MountainChartMath(this);
            this._export = new Exporter(this);
            this._export
                .prefix('vzb-mc-')
                .deleteClasses(['vzb-mc-mountains-mergestacked', 'vzb-mc-mountains-mergegrouped', 'vzb-mc-mountains', 'vzb-mc-year', 'vzb-mc-mountains-labels', 'vzb-mc-axis-labels']);

            this.xScale = null;
            this.yScale = null;
            this.cScale = null;

            this.xAxis = d3.svg.axisSmart();

            this.cached = {};
            this.mesh = [];
            this.yMax = 0;


            this.rescale = function (x) {
                return Math.exp(_this.model.time.gdpFactor * Math.log(x) + _this.model.time.gdpShift);
            };
            this.unscale = function (x) {
                return Math.exp((Math.log(x) - _this.model.time.gdpShift) / _this.model.time.gdpFactor);
            };

            // define path generator
            this.area = d3.svg.area()
                .interpolate('basis')
                .x(function (d) {return Math.round(_this.xScale(_this.rescale(d.x)));})
                .y0(function (d) {return Math.round(_this.yScale(d.y0));})
                .y1(function (d) {return Math.round(_this.yScale(d.y0 + d.y));});


            this.stack = d3.layout.stack()
                .order('reverse')
                .values(function (d) {return _this.cached[d.KEY()];})
                .out(function out(d, y0, y) {d.y0 = y0;});
        },


        /**
         * DOM is ready
         */
        domReady: function(){
            var _this = this;

            // reference elements
            this.element = d3.select(this.element);
            this.graph = this.element.select('.vzb-mc-graph');
            this.xAxisEl = this.graph.select('.vzb-mc-axis-x');
            this.xTitleEl = this.graph.select('.vzb-mc-axis-x-title');
            this.yTitleEl = this.graph.select('.vzb-mc-axis-y-title');
            this.infoEl = this.graph.select('.vzb-mc-axis-info');
            this.dataWarningEl = this.graph.select('.vzb-data-warning');
            this.yearEl = this.graph.select('.vzb-mc-year');
            this.mountainMergeStackedContainer = this.graph.select('.vzb-mc-mountains-mergestacked');
            this.mountainMergeGroupedContainer = this.graph.select('.vzb-mc-mountains-mergegrouped');
            this.mountainAtomicContainer = this.graph.select('.vzb-mc-mountains');
            this.mountainLabelContainer = this.graph.select('.vzb-mc-mountains-labels');
            this.tooltip = this.element.select('.vzb-mc-tooltip');
            this.eventAreaEl = this.element.select('.vzb-mc-eventarea');
            this.povertylineEl = this.element.select('.vzb-mc-povertyline');
            this.povertylineLineEl = this.povertylineEl.select('line');
            this.povertylineTextEl = this.povertylineEl.selectAll('text');

            this.element
              .onTap(function (d, i) {
                _this._interact()._mouseout(d, i);
              });
        },




        afterPreload: function(){
            var _this = this;

            var yearNow = _this.model.time.value.getFullYear();
            var yearEnd = _this.model.time.end.getFullYear();

            if(!this.precomputedShapes || !this.precomputedShapes[yearNow] || !this.precomputedShapes[yearEnd]) return;

            var yMax = this.precomputedShapes[this.model.time.yMaxMethod == 'immediate'? yearNow : yearEnd].yMax;
            var shape = this.precomputedShapes[yearNow].shape;

            if(!yMax || !shape || shape.length === 0) return;

            this.xScale = d3.scale.log().domain([this.model.marker.axis_x.min, this.model.marker.axis_x.max]);
            this.yScale = d3.scale.linear().domain([0, +yMax]);

            _this.updateSize(shape.length);

            shape = shape.map(function(m,i){return {x: _this.mesh[i], y0:0, y:+m};})

            this.mountainAtomicContainer.selectAll('.vzb-mc-prerender')
                .data([0])
                .enter().append('path')
                .attr('class', 'vzb-mc-prerender')
                .style('fill', 'pink')
                .style('opacity', 0)
                .attr('d', _this.area(shape))
                .transition().duration(1000).ease('linear')
                .style('opacity', 1);
        },

        readyOnce: function () {

            this.eventAreaEl.on('mousemove', function(){
                if (_this.model.time.dragging)return;
                var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });
                _this.updatePovertyLine({level: _this.xScale.invert(mouse[0]), full: true});

            }).on('mouseout', function(){
                if (_this.model.time.dragging)return;
                var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });
                _this.updatePovertyLine();
            });

            var _this = this;
            this.on('resize', function () {
                //console.log('acting on resize');
                _this.updateSize();
                _this.updateTime(); // respawn is needed
                _this.redrawDataPoints();
                _this.redrawSelectList();
                _this.updatePovertyLine();
            });

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            this.mountainAtomicContainer.select('.vzb-mc-prerender').remove();

        },

        ready: function(){
            //console.log("ready")
            this.updateUIStrings();
            this.updateIndicators();
            this.updateEntities();
            this.updateSize();
            this._spawnMasks();
            this.updateTime();
            this._adjustMaxY({force:true});
            this.redrawDataPoints();
            this.redrawDataPointsOnlyColors();
            this.highlightEntities();
            this.selectEntities();
            this.redrawSelectList();
            this.updateOpacity();
            this.updatePovertyLine();
        },


        updateUIStrings: function(){
            var _this = this;
            
            this.translator = this.model.language.getTFunction();
            var xMetadata = Vizabi._globals.metadata.indicatorsDB[this.model.marker.axis_x.which];


            this.xTitleEl.select('text')
                .text(this.translator('unit/mountainchart_hardcoded_income_per_day'));
            
            this.yTitleEl.select('text')
                .text(this.translator('mount/title'));

            this.dataWarningEl.html(iconset['warn']).select("svg").attr("width", "0px").attr("height", "0px");
            this.dataWarningEl.append("text")
                .text(this.translator("hints/dataWarning"));

            
            //TODO: move away from UI strings, maybe to ready or ready once
            this.infoEl.on("click", function(){
                window.open(xMetadata.sourceLink, '_blank').focus();
            })    
            this.dataWarningEl.on("click", function(){
               _this.parent.findChildByName("gapminder-datawarning").toggle();
            })  
        },

        /**
         * Updates indicators
         */
        updateIndicators: function () {
            var _this = this;

            //fetch scales, or rebuild scales if there are none, then fetch
            this.yScale = this.model.marker.axis_y.getScale();
            this.xScale = this.model.marker.axis_x.getScale();
            this.cScale = this.model.marker.color.getScale();

            this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
        },


        /**
         * Updates entities
         */
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
                    pointer.KEY = function(){return this[_this.KEY];};
                    pointer.sortValue = [_this.values.axis_y[pointer.KEY()], 0];
                    pointer.aggrLevel = 0;
                    return pointer;
                });


            //TODO: optimise this!
            this.groupedPointers = d3.nest()
                .key(function (d) {
                    return _this.model.marker.stack.use === 'property'? _this.values.stack[d.KEY()] : _this.values.group[d.KEY()];
                })
                .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0];})
                .entries(this.mountainPointers);


            var groupManualSort = this.model.marker.group.manualSorting;
            this.groupedPointers.forEach(function (group) {
                    var groupSortValue = d3.sum(group.values.map(function (m) {
                        return m.sortValue[0];
                    }));

                    if(groupManualSort && groupManualSort.length>1) groupSortValue = groupManualSort.indexOf(group.key);

                    group.values.forEach(function (d) {
                        d.sortValue[1] = groupSortValue;
                    });

                    group[_this.model.entities.getDimension()] = group.key; // hack to get highlihgt and selection work
                    group.KEY = function(){return this.key;};
                    group.aggrLevel = 1;
                });

            var sortGroupKeys = {};
            _this.groupedPointers.map(function(m){sortGroupKeys[m.key] = m.values[0].sortValue[1]; });


            // update the stacked pointers
            if (_this.model.marker.stack.which === 'none'){
                this.stackedPointers = [];
                this.mountainPointers.sort(function (a, b) {return b.sortValue[0] - a.sortValue[0];});

            }else{
                this.stackedPointers = d3.nest()
                    .key(function (d) { return _this.values.stack[d.KEY()]; })
                    .key(function (d) { return _this.values.group[d.KEY()]; })
                    .sortKeys(function(a,b) {return sortGroupKeys[b] - sortGroupKeys[a]; })
                    .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0]; })
                    .entries(this.mountainPointers);

                this.mountainPointers.sort(function (a, b) {return b.sortValue[1] - a.sortValue[1];});


                this.stackedPointers.forEach(function (stack) {
                    stack.KEY = function(){return this.key;};
                    stack[_this.model.entities.getDimension()] = stack.key; // hack to get highlihgt and selection work
                    stack.aggrLevel = 2;
                });
            }

            //console.log(JSON.stringify(this.mountainPointers.map(function(m){return m.geo})))
            //console.log(this.stackedPointers)


            //bind the data to DOM elements
            this.mountainsMergeStacked = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel2')
                .data(this.stackedPointers);
            this.mountainsMergeGrouped = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel1')
                .data(this.groupedPointers);
            this.mountainsAtomic = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel0')
                .data(this.mountainPointers);

            //exit selection -- remove shapes
            this.mountainsMergeStacked.exit().remove();
            this.mountainsMergeGrouped.exit().remove();
            this.mountainsAtomic.exit().remove();

            //enter selection -- add shapes
            this.mountainsMergeStacked.enter().append('path')
                .attr('class', 'vzb-mc-mountain vzb-mc-aggrlevel2');
            this.mountainsMergeGrouped.enter().append('path')
                .attr('class', 'vzb-mc-mountain vzb-mc-aggrlevel1');
            this.mountainsAtomic.enter().append('path')
                .attr('class', 'vzb-mc-mountain vzb-mc-aggrlevel0');

            //add interaction
            this.mountains = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain');

            this.mountains
              .on('mousemove', function (d, i) {
                if (utils.isTouchDevice()) return;

                _this._interact()._mousemove(d, i);
              })
              .on('mouseout', function (d, i) {
                if (utils.isTouchDevice()) return;

                _this._interact()._mouseout(d, i);
              })
              .on('click', function (d, i) {
                if (utils.isTouchDevice()) return;

                _this._interact()._click(d, i);
              })
              .onTap(function (d, i) {
                _this._interact()._mouseout(d, i);
                _this._interact()._mousemove(d, i);

                _this.tooltip.classed('vzb-hidden', false)
                  .html(_this.tooltip.html() + '<br>Hold to select it');

                d3.event.stopPropagation();
              })
              .onLongTap(function (d, i) {
                _this._interact()._mouseout(d, i);
                _this._interact()._click(d, i);
                d3.event.stopPropagation();
              })
        },


        _interact: function() {
            var _this = this;

            return {
                _mousemove: function (d, i) {
                    if (_this.model.time.dragging)return;

                    _this.model.entities.highlightEntity(d);

                    var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                    //position tooltip
                    _this._setTooltip(d.key?_this.translator('region/' + d.key):_this.model.marker.label.getValue(d)); 

                },
                _mouseout: function (d, i) {
                    if (_this.model.time.dragging)return;
                    
                    _this._setTooltip("");
                    _this.model.entities.clearHighlighted();
                },
                _click: function (d, i) {
                    _this.model.entities.selectEntity(d);
                }
            };

        },


        /*
         * Highlights all hovered shapes
         */
        highlightEntities: function () {
            var _this = this;
            this.someHighlighted = (this.model.entities.highlight.length > 0);

            if(!this.selectList || !this.someSelected) return;
            this.selectList.classed('vzb-highlight', function(d){return _this.model.entities.isHighlighted(d);});
        },



        selectEntities: function () {
            var _this = this;
            this.someSelected = (this.model.entities.select.length > 0);

            var listData = this.mountainPointers.concat(this.groupedPointers).concat(this.stackedPointers).filter(function(f){
                    return _this.model.entities.isSelected(f);
                })
                .sort(function (a, b) {
                    if(b.yMax && a.yMax) return b.yMax - a.yMax;
                    return b.sortValue[0] - a.sortValue[0];
                });

            this.selectList = this.mountainLabelContainer.selectAll('g')
                .data(utils.unique(listData, function(d){return d.KEY()}));

            this.selectList.exit().remove();
            this.selectList.enter().append('g')
                .attr('class', 'vzb-mc-label')
                .each(function(d, i){
                    d3.select(this).append('circle');
                    d3.select(this).append('text').attr('class', 'vzb-mc-label-shadow');
                    d3.select(this).append('text');
                })
                .on('mousemove', function (d, i) {
                    _this.model.entities.highlightEntity(d);
                })
                .on('mouseout', function (d, i) {
                    _this.model.entities.clearHighlighted();
                })
                .on('click', function (d, i) {
                    _this.model.entities.clearHighlighted();
                    _this.model.entities.selectEntity(d);
                });

        },


        _sumLeafPointersByMarker: function(branch, marker){
            var _this = this;
            if(!branch.key) return _this.values[marker][branch.KEY()];
            return d3.sum( branch.values.map(function(m){
                return _this._sumLeafPointersByMarker(m, marker);
            }) );
        },

        redrawSelectList: function(){
            var _this = this;
            if(!this.selectList || !this.someSelected) return;

            var sample = this.mountainLabelContainer.append('g').attr('class', 'vzb-mc-label').append('text').text('0');
            var fontHeight = sample[0][0].getBBox().height;
            d3.select(sample[0][0].parentNode).remove();
            var formatter = _this.model.marker.axis_y.tickFormatter;
            
            var titleHeight = this.yTitleEl.select('text').node().getBBox().height || 0;
            
            var maxFontHeight = (this.height - titleHeight*1.5) / (this.selectList.data().length + 2);
            if(fontHeight > maxFontHeight) fontHeight = maxFontHeight;

            this.selectList
                .attr('transform', function(d,i){return 'translate(0,' + (fontHeight*i + titleHeight*1.5) + ')';})
                .each(function(d, i){

                    var view = d3.select(this);
                    var name = d.key? _this.translator('region/' + d.key) : _this.values.label[d.KEY()];
                    var number = _this.values.axis_y[d.KEY()];

                    var string = name + ': ' + formatter(number) + (i===0?' people':'');

                    view.select('circle')
                        .attr('r', fontHeight/3)
                        .attr('cx', fontHeight*0.4)
                        .attr('cy', fontHeight/1.5)
                        .style('fill', _this.cScale(_this.values.color[d.KEY()]));


                    view.selectAll('text')
                        .attr('x', fontHeight)
                        .attr('y', fontHeight)
                        .text(string)
                        .style('font-size', fontHeight === maxFontHeight? fontHeight : null);
            });
        },

        updateOpacity: function () {
          var _this = this;
          //if(!duration)duration = 0;

          var OPACITY_HIGHLT = 1.0;
          var OPACITY_HIGHLT_DIM = 0.3;
          var OPACITY_SELECT = 0.8;
          var OPACITY_REGULAR = this.model.entities.opacityRegular;
          var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

          this.mountains.style('opacity', function(d){

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

          var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;

          // when pointer events need update...
          if (someSelectedAndOpacityZero !== this.someSelectedAndOpacityZero_1) {
            this.mountainsAtomic.style('pointer-events', function (d) {
              return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                'visible' : 'none';
            });
          }

          this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;
        },






        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function (time) {
            var _this = this;

            if(time==null)time = this.model.time.value;
            this.yearEl.text(time.getFullYear().toString());
            var filter = {};
            filter[_this.TIMEDIM] = time;
            this.values = this.model.marker.getValues(filter, [_this.KEY]);
            this.yMax = 0;


            //spawn the original mountains
            this.mountainPointers.forEach(function (d, i) {
                var vertices = _this._spawn(_this.values, d);
                _this.cached[d.KEY()] = vertices;
                d.hidden = vertices.length===0;
            });


            //recalculate stacking
            if(_this.model.marker.stack.which!=="none"){
                this.stackedPointers.forEach(function (group) {
                    var toStack = [];
                    group.values.forEach(function(subgroup){
                        toStack = toStack.concat(subgroup.values.filter(function(f){return !f.hidden;}));
                    });
                    _this.stack(toStack);
                });
            }

            this.mountainPointers.forEach(function(d){
                d.yMax = d3.max(_this.cached[d.KEY()].map(function(m){return m.y0 + m.y;}));
                if(_this.yMax < d.yMax) _this.yMax = d.yMax;
            });

            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;
            var dragOrPlay = (_this.model.time.dragging || _this.model.time.playing) && this.model.marker.stack.which!=='none';

            //if(mergeStacked){
                this.stackedPointers.forEach(function (d) {
                    var firstLast = _this._getFirstLastPointersInStack(d);
                    _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
                    _this.values.color[d.key] = '_default';
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

            if(!mergeStacked && !mergeGrouped && this.model.marker.stack.use==='property'){
                this.groupedPointers.forEach(function (d) {
                    var visible = d.values.filter(function(f){return !f.hidden;});
                    d.yMax = visible[0].yMax;
                    d.values.forEach(function(e){e.yMaxGroup = d.yMax;});
                });
            }


        },



        _getFirstLastPointersInStack: function(group){
            var _this = this;

            var visible, visible2;

            if(group.values[0].values){
                visible = group.values[0].values.filter(function(f){return !f.hidden;});
                visible2 = group.values[group.values.length-1].values.filter(function(f){return !f.hidden;});
                var first = visible[0];
                var last = visible2[visible2.length-1];
            }else{
                visible = group.values.filter(function(f){return !f.hidden;});
                var first = visible[0];
                var last = visible[visible.length-1];
            }

            return {first: first, last: last};
        },

        _getVerticesOfaMergedShape: function(arg){
            var _this = this;

            var first = arg.first.KEY();
            var last = arg.last.KEY();

            return _this.mesh.map(function(m, i){
                var y = _this.cached[first][i].y0 + _this.cached[first][i].y - _this.cached[last][i].y0;
                var y0 = _this.cached[last][i].y0;
                return { x: m, y0: y0, y: y};
            });
        },





        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        updateSize: function (meshLength) {

            var margin;
            var padding = 2;

            switch (this.getLayoutProfile()) {
            case 'small':
                margin = { top: 10, right: 10, left: 10, bottom: 25 };
                break;
            case 'medium':
                margin = { top: 20, right: 20, left: 20, bottom: 30 };
                break;
            case 'large':
                margin = { top: 30, right: 30, left: 30, bottom: 35  };
                break;
            }

            //mesure width and height
            this.height = parseInt(this.element.style('height'), 10) - margin.top - margin.bottom;
            this.width = parseInt(this.element.style('width'), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //year is centered and resized
            this.yearEl
                .attr('x', this.width / 2)
                .attr('y', this.height / 3 * 1.5)
                .style('font-size', Math.max(this.height / 4, this.width / 4) + 'px');

            //update scales to the new range
            this.yScale.range([this.height, 0]);
            this.xScale.range([0, this.width]);

            //need to know scale type of X to move on
            var scaleType = this._readyOnce? this.model.marker.axis_x.scaleType : 'log';

            //axis is updated
            this.xAxis.scale(this.xScale)
                .orient('bottom')
                .tickSize(6, 0)
                .tickSizeMinor(3, 0)
                .labelerOptions({
                    scaleType: scaleType,
                    toolMargin: margin,
                    method: this.xAxis.METHOD_REPEATING,
                    stops: this._readyOnce? this.model.time.xLogStops : [1]
                });


            this.xAxisEl
                .attr('transform', 'translate(0,' + this.height + ')')
                .call(this.xAxis);
            
            this.xTitleEl.select('text')
                .attr('transform', 'translate(' + this.width + ',' + this.height + ')')
                .attr('dy', '-0.36em');
            
            this.yTitleEl.select('text')
                .attr('transform', 'translate(0,' + margin.top + ')')
            
            var warnBB = this.dataWarningEl.select("text").node().getBBox();
            this.dataWarningEl.select("svg")
                .attr("width", warnBB.height)
                .attr("height", warnBB.height)
                .attr("x", warnBB.height * 0.1)
                .attr("y", -warnBB.height * 1.0 + 1)

            this.dataWarningEl
                .attr("transform", "translate(" + (0) + "," + (margin.top + warnBB.height * 1.5) + ")")
                .select("text")
                .attr("dx", warnBB.height*1.5);
            
            if(this.infoEl.select('text').node()){
                var titleH = this.infoEl.select('text').node().getBBox().height || 0;
                var titleW = this.yTitleEl.select('text').node().getBBox().width || 0;
                this.infoEl.attr('transform', 'translate('+ (titleW + titleH * 1.0) +',' + (margin.top - titleH * 0.3) + ')');
                this.infoEl.select("text").attr("dy", "0.1em")
                this.infoEl.select("circle").attr("r", titleH/2);
            }
                
            this.eventAreaEl
                .attr('y', this.height)
                .attr('width', this.width)
                .attr('height', margin.bottom);

            this._generateMesh(meshLength, scaleType);
        },

        _generateMesh: function(length, scaleType){
            // we need to generate the distributions based on mu, variance and scale
            // we span a uniform mesh across the entire X scale,
            if(!length) length = this.model.time.xPoints;

            var rangeFrom = scaleType === 'linear' ? this.xScale.domain()[0] : Math.log(this.unscale(this.xScale.domain()[0]));
            var rangeTo = scaleType === 'linear' ? this.xScale.domain()[1] : Math.log(this.unscale(this.xScale.domain()[1]));
            var rangeStep = (rangeTo - rangeFrom) / length;
            this.mesh = d3.range(rangeFrom, rangeTo, rangeStep).concat(rangeTo);

            if (scaleType !== 'linear') {
                this.mesh = this.mesh.map(function (dX) {return Math.exp(dX);});
            }else{
                this.mesh = this.mesh.filter(function (dX) {return dX > 0;});
            }

            return this.mesh;
        },

        _spawnMasks: function(){
            var _this = this;

            var povertyline = this.unscale(this.model.time.povertyline);
            var cutoff = this.unscale(this.model.time.povertyCutoff);
            var fade = this.model.time.povertyFade;
            var k = 2*Math.PI/(Math.log(povertyline)-Math.log(cutoff));
            var m = Math.PI - Math.log(povertyline) * k;


            this.spawnMask = [];
            this.cosineShape = [];
            this.cosineArea = 0;

            this.mesh.map(function (dX,i) {
                _this.spawnMask[i] = dX<cutoff?1:(dX>fade*7?0:Math.exp((cutoff-dX)/fade))
                _this.cosineShape[i] = (dX>cutoff && dX<povertyline? (1+Math.cos(Math.log(dX)*k+m)) : 0 );
                _this.cosineArea += _this.cosineShape[i];
            });
        },


        // get Y value for every X
        _spawn: function (values, d) {
            var _this = this;

            var norm = values.axis_y[d.KEY()];
            var sigma = _this._math.giniToSigma(values.size[d.KEY()]);
            var mu = _this._math.gdpToMu(values.axis_x[d.KEY()], sigma);

            if (!norm || !mu || !sigma) return [];

            var distribution = [];
            var acc = 0;

            this.mesh.map(function (dX,i) {
                distribution[i] = _this._math.pdf.lognormal(dX, mu, sigma);
                acc += _this.spawnMask[i] * distribution[i];
            });

            var result = this.mesh.map(function (dX, i) {
                return {x: dX, y0: 0,
                    y: norm * (distribution[i] * (1 - _this.spawnMask[i]) + _this.cosineShape[i]/_this.cosineArea * acc)
                }
            });

            return result;
        },


        _adjustMaxY: function(options){
            if(!options) options = {};
            var _this = this;
            var method = this.model.time.yMaxMethod;

            if(method!=='immediate' && !options.force) return;

            if(method==='latest') _this.updateTime(_this.model.time.end);

            if(!_this.yMax)utils.warn('Setting yMax to ' + _this.yMax + '. You failed again :-/');
            this.yScale.domain([0, _this.yMax]);

            if(method==='latest') _this.updateTime();
        },


        updatePovertyLine: function(options){
            var _this = this;
            if(!options)options = {};

            if(!options.level) options.level = this.model.time.povertyline;

            this.povertylineEl.classed('vzb-hidden', !options.level);
            if(!options.level) return;

            this.xAxisEl.call(this.xAxis.highlightValue(options.full? options.level : 'none'));

            var sumValue = 0;
            var totalArea = 0;
            var leftArea = 0;

            var _computeAreas = function(d) {
                sumValue += _this.values.axis_y[d.KEY()];
                _this.cached[d.KEY()].forEach(function(d){
                    totalArea += d.y;
                    if(_this.rescale(d.x)<options.level)leftArea += d.y;
                })
            };

            if(this.model.marker.stack.which==="all"){
                this.stackedPointers.forEach(_computeAreas);
            }else if(this.model.marker.stack.which==="none"){
                this.mountainPointers.forEach(_computeAreas);
            }else{
                this.groupedPointers.forEach(_computeAreas);
            }

            var formatter1 = d3.format('.3r');
            var formatter2 = _this.model.marker.axis_y.tickFormatter;
            var HEIGHT_OF_LABELS = 0.66;

            this.povertylineLineEl
                .attr('x1',this.xScale(options.level))
                .attr('x2',this.xScale(options.level))
                .attr('y1',this.height)
                .attr('y2',this.height*HEIGHT_OF_LABELS);

            this.povertylineTextEl.each(function(d,i){
                var view = d3.select(this);

                var string;
                if(i===0 || i===4) string = formatter1(leftArea/totalArea*100) + '%';
                if(i===1 || i===5) string = formatter1(100-leftArea/totalArea*100) + '%';
                if(i===2 || i===6) string = formatter2(sumValue * leftArea / totalArea);
                if(i===3 || i===7) string = formatter2(sumValue * (1 - leftArea / totalArea)) + ' ' + _this.translator('mount/people');

                view.text(string)
                    .classed('vzb-hidden', !options.full && i!==0 && i!==4)
                    .attr('x',_this.xScale(options.level) + ([0,4,2,6].indexOf(i)>-1? -5:+5))
                    .attr('y',_this.height * HEIGHT_OF_LABELS)
                    .attr('dy', [0,1,4,5].indexOf(i)>-1 ? 0 : '1.5em');
            })

            //if(this.model.time.record) console.log(this.model.time.value.getFullYear() + ', ' + leftArea/totalArea*100);

        },


        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function () {
            var _this = this;
            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;
            var dragOrPlay = (_this.model.time.dragging || _this.model.time.playing) && this.model.marker.stack.which!=='none';
            var stackMode = _this.model.marker.stack.which;

            //var speed = this.model.time.speed;
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

            if(stackMode === 'none'){
                this.mountainsAtomic.sort(function(a,b){return b.yMax - a.yMax;});

            }else if(stackMode === 'all'){
                // do nothing if everything is stacked

            }else{
                if(mergeGrouped || dragOrPlay){
                    this.mountainsMergeGrouped.sort(function(a,b){return b.yMax - a.yMax;});
                }else{
                    this.mountainsAtomic.sort(function(a,b){return b.yMaxGroup - a.yMaxGroup;});
                }
            }


//            if (!this.shapes) this.shapes = {}
//            this.shapes[this.model.time.value.getFullYear()] = {
//                yMax: d3.format('.2e')(_this.yMax),
//                shape: _this.cached['all'].map(function (d) {return d3.format('.2e')(d.y);})
//            }

        },


        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPointsOnlyColors: function () {
            var _this = this;
            this.mountains.style('fill', function(d){ return _this.cScale(_this.values.color[d.KEY()]); });
        },

        /*
         * RENDER SHAPE:
         * Helper function for plotting
         */
        _renderShape: function(view, key, hidden){
            var stack = this.model.marker.stack.which;

            view.classed('vzb-hidden', hidden);

            if(hidden){
                if(stack !== "none") view.style('stroke-opacity', 0);
                return;
            }

            view.attr('d', this.area(this.cached[key]));

            if(this.model.marker.color.use==="indicator") view
                .style('fill', this.cScale(this.values.color[key]));

            if(stack !== "none") view
                .transition().duration(Math.random()*900 + 100).ease('circle')
                .style('stroke-opacity', 0.5);

            if(this.model.time.record) this._export.write({type: 'path', id: key, time: this.model.time.value.getFullYear(), fill: this.cScale(this.values.color[key]), d: this.area(this.cached[key]) });
        },
        
        
    _setTooltip: function (tooltipText, x, y) {
      if (tooltipText) {
        var mouse = d3.mouse(this.graph.node()).map(function (d) {return parseInt(d)});

        //position tooltip
        this.tooltip.classed("vzb-hidden", false)
          //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
          .attr("transform", "translate(" + (x?x:mouse[0]-15) + "," + (y?y:mouse[1]-15) + ")")
          .selectAll("text")
          .text(tooltipText);

        var contentBBox = this.tooltip.select('text')[0][0].getBBox();
        this.tooltip.select('rect').attr("width", contentBBox.width + 8)
                .attr("height", contentBBox.height + 8)
                .attr("x", -contentBBox.width -4)
                .attr("y", -contentBBox.height -1)
                .attr("rx", contentBBox.height * 0.2)
                .attr("ry", contentBBox.height * 0.2);

      } else {

        this.tooltip.classed("vzb-hidden", true);
      }
    }




    });


}).call(this);
