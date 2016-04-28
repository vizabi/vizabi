import * as utils from 'base/utils';
import Component from 'base/component';
import label from 'helpers/d3.label';

import {close as iconClose} from 'base/iconset';

var OPTIONS = {
  TOOL_COMPONENT: null,
  CREATE_LABEL_CB: null,
  REMOVE_LABEL_CB: null,
  LABEL_TEXT_CB: null,
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
      name: "language",
      type: "language"
    }, {
      name: "ui",
      type: "model"
    }];

    this.context = context;

    this.model_binds = {
      "change:language.strings": function(evt) {
        _this.ready();
      },
      'change:marker.size_label.extent': function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        _this.updateLabelSizeLimits();
        
      },
      "change:entities.select": function() {
        if(!_this._readyOnce) return;
        //console.log("EVENT change:entities:select");
        _this.selectDataPoints();
      }

    }

    //contructor is the same as any component
    this._super(config, context);

    this.ui = utils.extend({
      //...add properties here
    }, this.ui);

  },

  ready: function() {
    this.translator = this.model.language.getTFunction();
    //this.setValues();
  },

  readyOnce: function() {
    var _this = this;
    
    this.KEY = this.model.entities.getDimension();
    //this.TIMEDIM = this.model.time.getDimension();
    
    this.cached = {};

    this.element = d3.select(this.placeholder);
    this.label = label(this);
    this.toolContext = OPTIONS.TOOL_COMPONENT;
    this.label.setCssPrefix(OPTIONS.CSS_PREFIX);
    this.labelsContainer = d3.select(this.root.element).select("." + OPTIONS.LABELS_CONTAINER_CLASS);
    this.linesContainer = d3.select(this.root.element).select("." + OPTIONS.LINES_CONTAINER_CLASS);
    this.updateIndicators();
    this.resize();
    this.selectDataPoints();
  },
  
  config: function(newOptions) {
    utils.extend(OPTIONS, newOptions);
  },

  updateLabelSizeLimits: function() {
    var _this = this;
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
    this.labelSizeTextScale = this.model.marker.size_label.getScale();
    this.label.setSizeTextScale(this.labelSizeTextScale)
  },
  
  setScales: function(xScale, yScale, sScale) {
    if(!this._readyOnce) return;
    this.label.setXScale(xScale)
      .setYScale(yScale);
  },

  selectDataPoints: function() {
    var _this = this;
    var KEY = this.KEY;

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
        //if(OPTIONS.REMOVE_LABEL_CB) OPTIONS.REMOVE_LABEL_CB(d);//_this._trails.run("remove", d);
        if(_this.cached[d[KEY]] != null) {
        _this.cached[d[KEY]] = void 0;
      }

      })
      .remove();
    this.entityLines.exit()
      .each(function(d) {
      })
      .remove();
    this.entityLines
      .enter().append('g')
      .attr("class", "vzb-bc-entity")
      .each(function(d, index) {
        _this.label.line(d3.select(this));
      });

    this.entityLabels
      .enter().append("g")
      .attr("class", "vzb-bc-entity")
      .each(function(d, index) {
        //if(OPTIONS.CREATE_LABEL_CB) OPTIONS.CREATE_LABEL_CB(d);//_this._trails.create(d);
        _this.label(d3.select(this));
      });
  },
  
  showCloseCross: function(d, show) {
    var KEY = this.KEY; 
        //show the little cross on the selected label
    this.entityLabels
        .filter(function(f){return f[KEY] == d[KEY]})
        .select(".vzb-bc-label-x")
        .classed("vzb-transparent", !show);

  },
  
  highlight: function(highlight) {
    
  },
  
  updateLabel: function(d, index, cache, valueL, valueLST, duration, showhide) {
    var _this = this;
    var KEY = this.KEY;
    if(d[KEY] == _this.druging)
      return;

    var _cssPrefix = OPTIONS.CSS_PREFIX;
    var _context = OPTIONS.TOOL_COMPONENT;

    // only for selected entities
    if(_this.model.entities.isSelected(d) && _this.entityLabels != null) {
      if(_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};
      
      var cached = _this.cached[d[KEY]];
      utils.extend(cached, cache);

      if(cached.scaledS0 == null || cached.labelX0 == null || cached.labelX0 == null) { //initialize label once
        cached.scaledS0 = cached.scaledS;
        cached.labelX0 = cached.valueX;
        cached.labelY0 = cached.valueY;
      }
      
      var select = utils.find(_this.model.entities.select, function(f) {
        return f[KEY] == d[KEY]
      });
      
      var brokenInputs = !cached.valueX && cached.valueX !==0 || !cached.valueY && cached.valueY !==0 || !cached.scaledS && cached.scaledS !==0;

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
          var labels = _this.model.ui.chart.labels || {};
          labelGroup.classed('vzb-label-boxremoved', labels.removeLabelBox);
          if(_this.sizeTextScale) {
            var range = _this.sizeTextScale.range();
            var fontSize = range[0] + Math.sqrt((_this.sizeTextScale(valueLST) - range[0]) * (range[1] - range[0]));
            text.attr('font-size', fontSize + 'px');
          }

          var rect = labelGroup.select("rect");

          var contentBBox = text[0][0].getBBox();
          if(!cached.contentBBox || cached.contentBBox.width != contentBBox.width) {
            cached.contentBBox = contentBBox;

            var labelCloseHeight = _this.closeCrossHeight || contentBBox.height;//_this.activeProfile.infoElHeight * 1.2;//contentBBox.height;

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
          }
          
          var viewWidth = _this.toolContext.width;       
          var viewHeight = _this.toolContext.height;       

          var _labelOffset = select.labelOffset || [0,0];

          cached.labelX_ = _labelOffset[0] || (-cached.scaledS0 * .75 - 5) / viewWidth;
          cached.labelY_ = _labelOffset[1] || (-cached.scaledS0 * .75 - 11) / viewHeight;

          var resolvedX0 = _this.label.xScale(cached.labelX0);
          var resolvedY0 = _this.label.yScale(cached.labelY0);
          var resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
          if(_labelOffset[0] == 0) {
            if(resolvedX - cached.contentBBox.width <= 0) { //check left
              cached.labelX_ = (cached.scaledS0 * .75 + cached.contentBBox.width + 10) / viewWidth;
              resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
            } else if(resolvedX + 15 > viewWidth) { //check right
              cached.labelX_ = (viewWidth - 15 - resolvedX0) / viewWidth;
              resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
            }
          }
          var resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
          if(_labelOffset[1] == 0) {
            if(resolvedY - cached.contentBBox.height <= 0) { // check top 
              cached.labelY_ = (cached.scaledS0 * .75 + cached.contentBBox.height) / viewHeight;
              resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
            } else if(resolvedY + 10 > viewHeight) { //check bottom
              cached.labelY_ = (viewHeight - 10 - resolvedY0) / viewHeight;
              resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
            }
          }
          _this.label._repositionLabels(d, index, this, resolvedX, resolvedY, resolvedX0, resolvedY0, duration, showhide, lineGroup);

        });

    } else {
      //for non-selected bubbles
      //make sure there is no cached data
      if(_this.cached[d[KEY]] != null) {
        _this.cached[d[KEY]] = void 0;
      }
    }
  },
  
  resize: function() {
    var profiles = {
      small: {
        minLabelTextSize: 7,
        maxLabelTextSize: 21,
        defaultLabelTextSize: 12,
        labelsLeashCoeff: 0.4
      },
      medium: {
        minLabelTextSize: 7,
        maxLabelTextSize: 30,
        defaultLabelTextSize: 15,
        labelsLeashCoeff: 0.3
      },
      large: {
        minLabelTextSize: 6,
        maxLabelTextSize: 48,
        defaultLabelTextSize: 20,
        labelsLeashCoeff: 0.2
      }
    };

    var _this = this;

    this.activeProfile = this.getActiveProfile(profiles);
    
    //label
    this.label//.setCloseCrossHeight(infoElHeight * 1.2)
      .setLeashCoeff(this.activeProfile.labelsLeashCoeff);
  }

});

export default Labels;