import * as utils from 'base/utils';
import Component from 'base/component';

import {close as iconClose} from 'base/iconset';

var label = function(context) {

  return function d3_label() {
  
    var _this = context;

    var _cssPrefix;
    label.setCssPrefix = function(cssPrefix) {
      _cssPrefix = cssPrefix;
      return label;
    }    

    var labelDragger = d3.behavior.drag()
      .on("dragstart", function(d, i) {
        d3.event.sourceEvent.stopPropagation();
        var KEY = _this.KEY;
      })
      .on("drag", function(d, i) {
        var KEY = _this.KEY;
        if(!_this.model.ui.chart.labels.dragging) return;
        if(!this.druging) _this.druging = d[KEY];
        var cache = _this.cached[d[KEY]];
        cache.labelFixed = true;
        
        var viewWidth = _this._toolContext.width;       
        var viewHeight = _this._toolContext.height;       

        cache.labelX_ += d3.event.dx / viewWidth;
        cache.labelY_ += d3.event.dy / viewHeight;

        var resolvedX = _this.xScale(cache.labelX0) + cache.labelX_ * viewWidth;
        var resolvedY = _this.yScale(cache.labelY0) + cache.labelY_ * viewHeight;

        var resolvedX0 = _this.xScale(cache.labelX0);
        var resolvedY0 = _this.yScale(cache.labelY0);

        var lineGroup = _this.entityLines.filter(function(f) {
          return f[KEY] == d[KEY];
        });

        label._repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, 0, null, lineGroup);
      })
      .on("dragend", function(d, i) {
        var KEY = _this.KEY;
        if(_this.druging) {
          var cache = _this.cached[d[KEY]];
          _this.druging = null;
          cache.labelOffset[0] = cache.labelX_;
          cache.labelOffset[1] = cache.labelY_;
          _this.model.entities.setLabelOffset(d, [cache.labelX_, cache.labelY_]);
        }
      });
    
    function label(container) {
      container
        .call(labelDragger)
        .each(function(d, index) {
          var view = d3.select(this);

  // Ola: Clicking bubble label should not zoom to countries boundary #811
  // It's too easy to accidentally zoom
  // This feature will be activated later, by making the label into a "context menu" where users can click Split, or zoom,.. hide others etc....

          view.append("rect")
            .attr("class","vzb-label-glow")
            .attr("filter", "url(" + location.pathname + "#vzb-glow-filter)");
          view.append("rect")
            .attr("class","vzb-label-fill vzb-tooltip-border");
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

          view.append("text").attr("class", _cssPrefix + "-label-content vzb-label-shadow");

          view.append("text").attr("class", _cssPrefix + "-label-content");

          var cross = view.append("g").attr("class", _cssPrefix + "-label-x vzb-transparent");
          utils.setIcon(cross, iconClose);

          cross.insert("circle", "svg");

          cross.select("svg")
            .attr("class", _cssPrefix + "-label-x-icon")
            .attr("width", "0px")
            .attr("height", "0px");

          cross.on("click", function() {
            _this.model.entities.clearHighlighted();
            //default prevented is needed to distinguish click from drag
            if(d3.event.defaultPrevented) return;
            _this.model.entities.selectEntity(d);
          });

        })
        .on("mouseover", function(d) {
          if(utils.isTouchDevice()) return;
          _this.model.entities.highlightEntity(d, null, null, true);
          var KEY = _this.KEY || _this.model.entities.getDimension();
          // hovered label should be on top of other labels: if "a" is not the hovered element "d", send "a" to the back
          _this.entityLabels.sort(function (a, b) { return a[KEY] != d[KEY]? -1 : 1; });
          d3.select(this).selectAll("." + _cssPrefix + "-label-x")
            .classed("vzb-transparent", false);
        })
        .on("mouseout", function(d) {
          if(utils.isTouchDevice()) return;
          _this.model.entities.clearHighlighted();
          d3.select(this).selectAll("." + _cssPrefix + "-label-x")
            .classed("vzb-transparent", true);
        })
        .on("click", function(d) {
          if (!utils.isTouchDevice()) return;
          var cross = d3.select(this).selectAll("." + _cssPrefix + "-label-x");
          cross.classed("vzb-transparent", !cross.classed("vzb-transparent"));
        });
    
      return label;  
    };

    label.line = function(container) {
      container.append("line").attr("class", _cssPrefix + "-label-line");
    };
            



    label._repositionLabels = _repositionLabels;
    function _repositionLabels(d, i, labelContext, _X, _Y, _X0, _Y0, duration, showhide, lineGroup) {

      var cache = _this.cached[d[_this.KEY]];

      var labelGroup = d3.select(labelContext);

      //protect label and line from the broken data
      var brokenInputs = !_X && _X !==0 || !_Y && _Y !==0 || !_X0 && _X0 !==0 || !_Y0 && _Y0 !==0;
      if(brokenInputs) {
          labelGroup.classed("vzb-invisible", brokenInputs);
          lineGroup.classed("vzb-invisible", brokenInputs);
          return;
      }
      
      var viewWidth = _this._toolContext.width;       
      var viewHeight = _this._toolContext.height;       
      var rectBBox = cache.rectBBox;
      var width = rectBBox.width;
      var height = rectBBox.height;

      //apply limits so that the label doesn't stick out of the visible field
      if(_X - width <= 0) { //check left
        _X = width;
        cache.labelX_ = (_X - _this.xScale(cache.labelX0)) / viewWidth;
      } else if(_X + 5 > viewWidth) { //check right
        _X = viewWidth - 5; 
        cache.labelX_ = (_X - _this.xScale(cache.labelX0)) / viewWidth;
      }
      if(_Y - height * .75 <= 0) { // check top
        _Y = height * .75;
        cache.labelY_ = (_Y - _this.yScale(cache.labelY0)) / viewHeight;
      } else if(_Y + height * .35 > viewHeight) { //check bottom
        _Y = viewHeight - height * .35;
        cache.labelY_ = (_Y - _this.yScale(cache.labelY0)) / viewHeight;
      }

      if(duration == null) duration = _this._toolContext.duration;
      if(duration) {
        if(showhide && !d.hidden){
            //if need to show label
          
            labelGroup.classed("vzb-invisible", d.hidden);
            labelGroup
                .attr("transform", "translate(" + _X + "," + _Y + ")")
                .style("opacity", 0)
                .transition().duration(duration).ease("exp")
                .style("opacity", 1)
                //i would like to set opactiy to null in the end of transition. 
                //but then fade in animation is not working for some reason
                .each("interrupt", function(){
                    labelGroup
                        .style("opacity", 1)
                });
            lineGroup.classed("vzb-invisible", d.hidden);
            lineGroup
                .attr("transform", "translate(" + _X + "," + _Y + ")")
                .style("opacity", 0)
                .transition().duration(duration).ease("exp")
                .style("opacity", 1)
                //i would like to set opactiy to null in the end of transition. 
                //but then fade in animation is not working for some reason
                .each("interrupt", function(){
                    lineGroup
                        .style("opacity", 1)
                });
            
        } else if(showhide && d.hidden) {
            //if need to hide label
            
            labelGroup
                .style("opacity", 1)
                .transition().duration(duration).ease("exp")
                .style("opacity", 0)
                .each("end", function(){
                    labelGroup
                        .style("opacity", 1) //i would like to set it to null. but then fade in animation is not working for some reason
                        .classed("vzb-invisible", d.hidden);
                })
            lineGroup
                .style("opacity", 1)
                .transition().duration(duration).ease("exp")
                .style("opacity", 0)
                .each("end", function(){
                    lineGroup
                        .style("opacity", 1) //i would like to set it to null. but then fade in animation is not working for some reason
                        .classed("vzb-invisible", d.hidden);
                })      
            
        } else {
            // just update the position
            
            labelGroup
                .transition().duration(duration).ease("linear")
                .attr("transform", "translate(" + _X + "," + _Y + ")");
            lineGroup
                .transition().duration(duration).ease("linear")
                .attr("transform", "translate(" + _X + "," + _Y + ")");
        }
          
      } else {
        labelGroup
            .interrupt()
            .attr("transform", "translate(" + _X + "," + _Y + ")");
        lineGroup
            .interrupt()
            .attr("transform", "translate(" + _X + "," + _Y + ")");
        if(showhide) labelGroup.classed("vzb-invisible", d.hidden);
        if(showhide) lineGroup.classed("vzb-invisible", d.hidden);
      }

      var diffX1 = _X0 - _X;
      var diffY1 = _Y0 - _Y;
      var textBBox = labelGroup.select('text').node().getBBox();
      var diffX2 = -textBBox.width * .5;
      var diffY2 = -height * .2;
      var labels = _this.model.ui.chart.labels;

      var bBox = labels.removeLabelBox ? textBBox : rectBBox;
      
      var FAR_COEFF = _this.activeProfile.labelLeashCoeff||0;

      var lineHidden = circleRectIntersects({x: diffX1, y: diffY1, r: cache.scaledS0},
        {x: diffX2, y: diffY2, width: (bBox.height * 2 * FAR_COEFF + bBox.width), height: (bBox.height * (2 * FAR_COEFF + 1))});
      lineGroup.select('line').classed("vzb-invisible", lineHidden);
      if(lineHidden) return;

      if(labels.removeLabelBox) {
        var angle = Math.atan2(diffX1 - diffX2, diffY1 - diffY2) * 180 / Math.PI;
        var deltaDiffX2 = (angle >= 0 && angle <= 180) ? (bBox.width * .5) : (-bBox.width * .5);
        var deltaDiffY2 = (Math.abs(angle) <= 90) ? (bBox.height * .55) : (-bBox.height * .45);
        diffX2 += Math.abs(diffX1 - diffX2) > textBBox.width * .5 ? deltaDiffX2 : 0;
        diffY2 += Math.abs(diffY1 - diffY2) > textBBox.height * .5 ? deltaDiffY2 : (textBBox.height * .05);
      }

      var longerSideCoeff = Math.abs(diffX1) > Math.abs(diffY1) ? Math.abs(diffX1) / viewWidth : Math.abs(diffY1) / viewHeight;
      lineGroup.select("line").style("stroke-dasharray", "0 " + (cache.scaledS0) + " " + ~~(longerSideCoeff + 2) + "00%");

      lineGroup.selectAll("line")
        .attr("x1", diffX1)
        .attr("y1", diffY1)
        .attr("x2", diffX2)
        .attr("y2", diffY2);

    }
  
    /*
    * Adapted from 
    * http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
    * 
    * circle { 
    *  x: center X 
    *  y: center Y
    *  r: radius
    * }
    * 
    * rect {
    *  x: center X
    *  y: center Y
    *  width: width
    *  height: height
    * }
    */
    function circleRectIntersects(circle, rect) {
      var circleDistanceX = Math.abs(circle.x - rect.x);
      var circleDistanceY = Math.abs(circle.y - rect.y);    
      var halfRectWidth = rect.width * .5;
      var halfRectHeight = rect.height * .5;

      if (circleDistanceX > (halfRectWidth + circle.r)) { return false; }
      if (circleDistanceY > (halfRectHeight + circle.r)) { return false; }

      if (circleDistanceX <= halfRectWidth) { return true; } 
      if (circleDistanceY <= halfRectHeight) { return true; }

      var cornerDistance_sq = Math.pow(circleDistanceX - halfRectWidth, 2) +
                          Math.pow(circleDistanceY - halfRectHeight, 2);

      return (cornerDistance_sq <= Math.pow(circle.r,2));
    }

    return label;
  }();
}

var OPTIONS = {
  TOOL_CONTEXT: null,
  LABELS_CONTAINER_CLASS: '',
  LINES_CONTAINER_CLASS: '',
  CSS_PREFIX: ''
}; 

var Labels = Component.extend({

  init: function(config, context) {
    var _this = this;

    this.name = 'gapminder-labels';

    this.model_expects = [{
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "ui",
      type: "model"
    }];

    this.context = context;

    this.model_binds = {
      "change:entities.select": function() {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:entities:select");
        _this.selectDataPoints();
      }
    }
    if(context.model.state.marker.size_label)
      this.model_binds['change:marker.size_label.extent'] = function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        _this.updateLabelSizeLimits();
        _this.updateLabelsOnlyTextSize();
      }
    if(context.model.ui.chart.labels.hasOwnProperty('removeLabelBox'))
      this.model_binds['change:ui.chart.labels.removeLabelBox'] = function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        _this.updateLabelsOnlyTextSize();
      }

    //contructor is the same as any component
    this._super(config, context);

    this.ui = utils.extend({
      //...add properties here
    }, this.ui);

    this.label = label(this);
    this._xScale = null;
    this._yScale = null;
    this._closeCrossHeight = 0;
    this.labelSizeTextScale = null;
  },

  ready: function() {
    this.updateLabelSizeLimits();
    this.updateIndicators();
    //this.updateLabelsOnlyTextSize();
  },

  readyOnce: function() {
    var _this = this;
    
    this.KEY = this.model.entities.getDimension();
    
    this.cached = {};

    this._toolContext = OPTIONS.TOOL_CONTEXT;
    this._cssPrefix = OPTIONS.CSS_PREFIX;
    this.label.setCssPrefix(OPTIONS.CSS_PREFIX);
    
    this.rootEl = this.root.element instanceof Array? this.root.element : d3.select(this.root.element);
    this.labelsContainer = this.rootEl.select("." + OPTIONS.LABELS_CONTAINER_CLASS);
    this.linesContainer = this.rootEl.select("." + OPTIONS.LINES_CONTAINER_CLASS);
    this.updateIndicators();
    this.updateSize();
    this.selectDataPoints();
  },
  
  config: function(newOptions) {
    utils.extend(OPTIONS, newOptions);
  },

  updateLabelSizeLimits: function() {
    var _this = this;
    if (!this.model.marker.size_label) return;
    var extent = this.model.marker.size_label.extent || [0,1];

    var minLabelTextSize = this.activeProfile.minLabelTextSize;
    var maxLabelTextSize = this.activeProfile.maxLabelTextSize;
    var minMaxDelta = maxLabelTextSize - minLabelTextSize;

    this.minLabelTextSize = Math.max(minLabelTextSize + minMaxDelta * extent[0], minLabelTextSize);
    this.maxLabelTextSize = Math.max(minLabelTextSize + minMaxDelta * extent[1], minLabelTextSize);

    if(this.model.marker.size_label.use == 'constant') {
      // if(!this.model.marker.size_label.which) {
      //   this.maxLabelTextSize = this.activeProfile.defaultLabelTextSize;
      //   this.model.marker.size_label.set({'domainMax': (this.maxLabelTextSize - minLabelTextSize) / minMaxDelta, 'which': '_default'});
      //   return; 
      // }
      this.minLabelTextSize = this.maxLabelTextSize;
    } 

    if(this.model.marker.size_label.scaleType !== "ordinal" || this.model.marker.size_label.use == 'constant') {
      this.labelSizeTextScale.range([_this.minLabelTextSize, _this.maxLabelTextSize]);
    } else {
      this.labelSizeTextScale.rangePoints([_this.minLabelTextSize, _this.maxLabelTextSize], 0).range();
    }

  },
  
  updateIndicators: function() {
    var _this = this;

    //scales
    if(this.model.marker.size_label) {
      this.labelSizeTextScale = this.model.marker.size_label.getScale();
    }
  },
  
  setScales: function(xScale, yScale) {
    if(!this._readyOnce) return;
    this._xScale = xScale;
    this._yScale = yScale;
  },
  
  setCloseCrossHeight: function(closeCrossHeight) {
    this._closeCrossHeight = closeCrossHeight;
  },
 
  xScale: function(x) {
    return this._xScale ? this._xScale(x) : (x * this._toolContext.width);
  },

  yScale: function(y) {
    return this._yScale ? this._yScale(y) : (y * this._toolContext.height);
  },

  selectDataPoints: function() {
    var _this = this;
    var KEY = this.KEY;
    var _cssPrefix = this._cssPrefix;

    this.entityLabels = this.labelsContainer.selectAll("." + _cssPrefix + "-entity")
      .data(_this.model.entities.select, function(d) {
        return(d[KEY]);
      });
    this.entityLines = this.linesContainer.selectAll("." + _cssPrefix + "-entity")
      .data(_this.model.entities.select, function(d) {
        return(d[KEY]);
      });

    this.entityLabels.exit()
      .each(function(d) {
        if(_this.cached[d[KEY]] != null) {
            _this.cached[d[KEY]] = void 0;
        }
      })
      .remove();
    this.entityLines.exit()
      .remove();
    this.entityLines
      .enter().append('g')
      .attr("class", _cssPrefix + "-entity")
      .each(function(d, index) {
        _this.label.line(d3.select(this));
      });

    this.entityLabels
      .enter().append("g")
      .attr("class", _cssPrefix + "-entity")
      .each(function(d, index) {
        _this.cached[d[KEY]] = {};      
        _this.label(d3.select(this));
      });
  },
  
  showCloseCross: function(d, show) {
    var KEY = this.KEY; 
    //show the little cross on the selected label
    this.entityLabels
        .filter(function(f){return f[KEY] == d[KEY]})
        .select("." + this._cssPrefix + "-label-x")
        .classed("vzb-transparent", !show);
  },
  
  highlight: function(d, highlight) {
    var KEY = this.KEY; 
    var labels = this.entityLabels; 
    if(d) {
      labels = labels.filter(function(f) {
          return f[KEY] == d[KEY]
        });
    }
    labels.classed("vzb-highlighted", highlight);
  },
  
  updateLabel: function(d, index, cache, valueX, valueY, valueS, valueC, valueL, valueLST, duration, showhide) {
    var _this = this;
    var KEY = this.KEY;
    if(d[KEY] == _this.druging)
      return;

    var _cssPrefix = OPTIONS.CSS_PREFIX;
    var _context = OPTIONS.TOOL_CONTEXT;

    // only for selected entities
    if(_this.model.entities.isSelected(d) && _this.entityLabels != null) {
      if(_this.cached[d[KEY]] == null) this.selectDataPoints();
      
      var cached = _this.cached[d[KEY]];
      if(cache) utils.extend(cached, cache);


      if(cached.scaledS0 == null || cached.labelX0 == null || cached.labelY0 == null) { //initialize label once
        if(valueS) cached.scaledS0 = utils.areaToRadius(this._toolContext.sScale(valueS));
        cached.labelX0 = valueX;
        cached.labelY0 = valueY;
        cached.valueLST = valueLST;
        cached.scaledC0 = valueC!=null?this._toolContext.cScale(valueC):this._toolContext.COLOR_WHITEISH;
      }

      if(cached.labelX_ == null || cached.labelY_ == null)
      {            
        var select = utils.find(_this.model.entities.select, function(f) {
          return f[KEY] == d[KEY]
        });
        cached.labelOffset = select.labelOffset || [0,0];
      }

      var brokenInputs = !cached.labelX0 && cached.labelX0 !==0 || !cached.labelY0 && cached.labelY0 !==0 || !cached.scaledS0 && cached.scaledS0 !==0;

      var lineGroup = _this.entityLines.filter(function(f) {
        return f[KEY] == d[KEY];
      });
      // reposition label
      _this.entityLabels.filter(function(f) {
          return f[KEY] == d[KEY]
        })
        .each(function(groupData) {

          var labelGroup = d3.select(this);

          if (brokenInputs) {
            labelGroup.classed("vzb-invisible", brokenInputs);
            lineGroup.classed("vzb-invisible", brokenInputs);
            return;
          }

          var text = labelGroup.selectAll("." + _cssPrefix + "-label-content")
            .text(valueL);                       
          
          _this._updateLabelSize(d, index, labelGroup, valueLST, text);          
          
          _this.positionLabel(d, index, this, duration, showhide, lineGroup);
        });
    }
  },
  
  _updateLabelSize: function(d, index, labelGroup, valueLST, text) { 
    var _this = this;
    var KEY = this.KEY;
    var cached = _this.cached[d[KEY]];

    
    var _cssPrefix = OPTIONS.CSS_PREFIX;
    var _context = OPTIONS.TOOL_CONTEXT;

                   
    var labels = _this.model.ui.chart.labels || {};
    labelGroup.classed('vzb-label-boxremoved', labels.removeLabelBox);
    
    var _text = text || labelGroup.selectAll("." + _cssPrefix + "-label-content"); 
    
    if(valueLST != null && _this.labelSizeTextScale) {
      var range = _this.labelSizeTextScale.range();
      var fontSize = range[0] + Math.sqrt((_this.labelSizeTextScale(valueLST) - range[0]) * (range[1] - range[0]));
      _text.attr('font-size', fontSize + 'px');
    }

    var contentBBox = _text[0][0].getBBox();
    
    var rect = labelGroup.selectAll("rect");
    
    if(!cached.textWidth || cached.textWidth != contentBBox.width) {
      cached.textWidth = contentBBox.width;

      var labelCloseHeight = _this._closeCrossHeight || contentBBox.height;//_this.activeProfile.infoElHeight * 1.2;//contentBBox.height;

      var labelCloseGroup = labelGroup.select("." + _cssPrefix + "-label-x")
        .attr('transform', 'translate(' + 4 + ',' + (-contentBBox.height * .85) + ')');
        //.attr("x", /*contentBBox.height * .0 + */ 4)
        //.attr("y", contentBBox.height * -1);

      labelCloseGroup.select("circle")
        .attr("cx", /*contentBBox.height * .0 + */ 0)
        .attr("cy", 0)
        .attr("r", labelCloseHeight * .5);

      labelCloseGroup.select("svg")
        .attr("x", -labelCloseHeight * .5 )
        .attr("y", labelCloseHeight * -.5)
        .attr("width", labelCloseHeight)
        .attr("height", labelCloseHeight)
  
      rect.attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * .85)
        .attr("rx", contentBBox.height * .2)
        .attr("ry", contentBBox.height * .2);

      //cache label bound rect for reposition
      cached.rectBBox = rect.node().getBBox();
      //cached.moveX = 5;
      //cached.moveY = contentBBox.height * .3;
    }
    
    var glowRect = labelGroup.select(".vzb-label-glow")
    if(glowRect.attr("stroke") !== cached.scaledC0) {
      glowRect.attr("stroke", cached.scaledC0);
    }
  },
    
  updateLabelsOnlyTextSize: function() {
    var _this = this;
    var KEY = this.KEY;
    
    this.entityLabels.each(function(d, index) {
      var cached = _this.cached[d[KEY]];
        _this._updateLabelSize(d, index, d3.select(this), _this._toolContext.frame.size_label[d[KEY]]);
        var lineGroup = _this.entityLines.filter(function(f) {
          return f[KEY] == d[KEY];
        });
        _this.positionLabel(d, index, this, 0, null, lineGroup);
      });
  },
  
  updateLabelOnlyPosition: function(d, index, cache) {
    var _this = this;
    var KEY = this.KEY;
    var cached = this.cached[d[KEY]];
    if(cache) utils.extend(cached, cache);

    var lineGroup = _this.entityLines.filter(function(f) {
      return f[KEY] == d[KEY];
    });
    
    this.entityLabels.filter(function(f) {
        return f[KEY] == d[KEY]
      })
      .each(function(groupData) {
        _this.positionLabel(d, index, this, 0, null, lineGroup);
      });
  },

  updateLabelOnlyColor: function(d, index, cache) {
    var _this = this;
    var KEY = this.KEY;
    var cached = this.cached[d[KEY]];
    if(cache) utils.extend(cached, cache);

    var labelGroup = _this.entityLabels.filter(function(f) {
      return f[KEY] == d[KEY];
    });
   
    _this._updateLabelSize(d, index, labelGroup, null);
    
  },
  
  positionLabel: function(d, index, context, duration, showhide, lineGroup) {
    var KEY = this.KEY;
    var cached = this.cached[d[KEY]];

    var viewWidth = this._toolContext.width;       
    var viewHeight = this._toolContext.height;       

    var resolvedX0 = this.xScale(cached.labelX0);
    var resolvedY0 = this.yScale(cached.labelY0);
    
    if(!cached.labelOffset) cached.labelOffset = [0,0];
    cached.labelX_ = cached.labelOffset[0] || (-cached.scaledS0 * .75 - 5) / viewWidth;
    cached.labelY_ = cached.labelOffset[1] || (-cached.scaledS0 * .75 - 11) / viewHeight;
    
    //check default label position and switch to mirror position if position 
    //does not bind to visible field

    var resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
    if(cached.labelOffset[0] == 0) {
      if(resolvedX - cached.rectBBox.width <= 0) { //check left
        cached.labelX_ = (cached.scaledS0 * .75 + cached.rectBBox.width) / viewWidth;
        resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
      } else if(resolvedX + 15 > viewWidth) { //check right
        cached.labelX_ = (viewWidth - 15 - resolvedX0) / viewWidth;
        resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
      }
    }
    var resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
    if(cached.labelOffset[1] == 0) {
      if(resolvedY - cached.rectBBox.height <= 0) { // check top 
        cached.labelY_ = (cached.scaledS0 * .75 + cached.rectBBox.height) / viewHeight;
        resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
      } else if(resolvedY + 10 > viewHeight) { //check bottom
        cached.labelY_ = (viewHeight - 10 - resolvedY0) / viewHeight;
        resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
      }
    }
    this.label._repositionLabels(d, index, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration, showhide, lineGroup);
  },
  
  updateSize: function() {
    var profiles = {
      small: {
        minLabelTextSize: 7,
        maxLabelTextSize: 21,
        defaultLabelTextSize: 12,
        labelLeashCoeff: 0.4
      },
      medium: {
        minLabelTextSize: 7,
        maxLabelTextSize: 30,
        defaultLabelTextSize: 15,
        labelLeashCoeff: 0.3
      },
      large: {
        minLabelTextSize: 6,
        maxLabelTextSize: 48,
        defaultLabelTextSize: 20,
        labelLeashCoeff: 0.2
      }
    };

    var _this = this;

    this.activeProfile = this.getActiveProfile(profiles);
    
    this.updateLabelSizeLimits();
  }

});

export default Labels;