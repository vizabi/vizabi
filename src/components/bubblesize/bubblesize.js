import * as utils from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals';


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

var OPTIONS = {
  DOMAIN_MIN: 0,
  DOMAIN_MAX: 1,
  TEXT_PARAMS: { TOP: 18, LEFT: 8, MAX_WIDTH: 42, MAX_HEIGHT: 10 },
  BAR_WIDTH: 6,
  THUMB_RADIUS: 10,
  THUMB_STROKE_WIDTH: 4,
  INTRO_DURATION: 250
}

var profiles = {
    "small": {
      minRadius: 0.5,
      maxRadius: 40
    },
    "medium": {
      minRadius: 1,
      maxRadius: 55
    },
    "large": {
      minRadius: 1,
      maxRadius: 70
    }
};


var min = .1,
  max = 100;

var BubbleSize = Component.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init: function (config, context) {
    
    this.name = 'bubblesize';
    
    this.template = this.template || "bubblesize.html";

    this.model_expects = [{
      name: "size",
      type: "size"
    }];

    this.fields = { min: 'min', max: 'max' };

    var _this = this;
    this.model_binds = {
      'change:size': function (evt) {
        var size = _this.brush.extent();
        if (evt.indexOf(_this.fields.min) > -1) {
          size[0] = _this.model.size[_this.fields.min];
        }
        if (evt.indexOf(_this.fields.max) > -1) {
          size[1] = _this.model.size[_this.fields.max];
        }
        _this.sliderEl.call(_this.brush.extent(size));
        _this.sliderEl.call(_this.brush.event);
      },
      'ready': function (evt) {
        if(_this.model.size.scale) {
            _this.sizeScaleMinMax = _this.model.size.scale.domain();
        }
        if(_this._readyOnce) {
           _this._setLabelsText();
        }
      }
    };

    //contructor is the same as any component
    this._super(config, context);
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce: function () {
    var values = [this.model.size.min, this.model.size.max],
      _this = this;
    this.element = d3.select(this.element);
    this.sliderSvg = this.element.select(".vzb-bs-svg");
    this.sliderWrap = this.sliderSvg.select(".vzb-bs-slider-wrap");
    this.sliderEl = this.sliderWrap.select(".vzb-bs-slider");
             
    var
      textMargin = { top: OPTIONS.TEXT_PARAMS.TOP, left: OPTIONS.TEXT_PARAMS.LEFT },
      textMaxWidth = OPTIONS.TEXT_PARAMS.MAX_WIDTH,
      textMaxHeight = OPTIONS.TEXT_PARAMS.MAX_HEIGHT,
      barWidth = OPTIONS.BAR_WIDTH,
      thumbRadius = OPTIONS.THUMB_RADIUS,
      thumbStrokeWidth = OPTIONS.THUMB_STROKE_WIDTH,
      introDuration = OPTIONS.INTRO_DURATION,
      padding = {
        top: 0,
        left: textMargin.left + textMaxWidth, //thumbRadius + thumbStrokeWidth 
        right: textMargin.left + textMaxWidth, //thumbRadius + thumbStrokeWidth
        bottom: thumbRadius + thumbStrokeWidth //textMargin.top + textMaxHeight
      }
      
    this.padding = padding;

    var minMaxBubbleRadius = this.getMinMaxBubbleRadius(); 

    this.xScale = d3.scale.linear()
      .domain([OPTIONS.DOMAIN_MIN, OPTIONS.DOMAIN_MAX])
      .range([minMaxBubbleRadius.min * 2, minMaxBubbleRadius.max * 2])
      .clamp(true)

    this.brush = d3.svg.brush()
      .x(this.xScale)
      .extent([OPTIONS.DOMAIN_MIN, OPTIONS.DOMAIN_MIN])
      .on("brush", function () {
        var s = _this.brush.extent();

        updateArcs(s);
        updateLabels(s);

        _this._setValue(s);
      })
      .on("brushend", function () {
         _this.sliderEl.selectAll(".resize")
          .style("display", null)
      });
   
    this.sliderEl
      .call(_this.brush);
      
    //For return to arc
    //var thumbArc = d3.svg.arc()
    //  .outerRadius(thumbRadius)
    //  .startAngle(0)
    //  .endAngle(2 * Math.PI)
    
    this.sliderThumbs = this.sliderEl.selectAll(".resize").sort(d3.descending)
      .classed("vzb-bs-slider-thumb", true)
    
    this.sliderThumbs.append("g")
      .attr("class", "vzb-bs-slider-thumb-badge")
      .append("path")
      .attr("d", "M0 0 l" + (thumbRadius * 2) + " " + (-thumbRadius) + "v" + (thumbRadius * 2) + "Z")
      //For return to arc
      //.attr("d", thumbArc)
      
    this.sliderThumbs.append("path")
      .attr("class", "vzb-bs-slider-thumb-arc")
    this.sliderEl.selectAll("text").data([0,0]).enter()
      .append("text")
      .attr("class", "vzb-bs-slider-thumb-label")
      .attr("dy", "0.35em")
      .attr("text-anchor", function(d, i) {
        return i ? "start" : "end"})
    
    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-bs-slider-thumb-label");
    
    this.sliderEl.selectAll("rect")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")")
    this.sliderEl.select(".extent")
      .classed("vzb-bs-slider-extent", true)
    
    var valueArc = d3.svg.arc()
      .outerRadius(function (d) { return _this.xScale(d) * 0.5 })
      .innerRadius(function (d) { return _this.xScale(d) * 0.5 })
      .startAngle(-Math.PI * 0.5)
      .endAngle(Math.PI * 1.5)

    function updateArcs(s) {
      _this.sliderThumbs.select('.vzb-bs-slider-thumb-arc').data(s)
        .attr("d", valueArc)
        .attr("transform", function (d) { return "translate(" + (-_this.xScale(d) * 0.5) + ",0)"; })
    }

    function updateLabels(s) {
      _this.sliderLabelsEl.data(s)
      .attr("transform", circleLabelTransform);
    }
    
    var arcLabelTransform = function(d, i) {
       var dX = textMargin.left + _this.xScale(d),
           dY = textMargin.top * (i ? -1.0 : 1.0);
       return "translate(" + (dX) + "," + (dY) + ")";
    }

    var circleLabelTransform = function(d, i) {
       var dX = i ? textMargin.left + _this.xScale(d) : -textMargin.left,
           dY = -textMargin.top;
       return "translate(" + (dX) + "," + (dY) + ")";      
    }

    this.on("resize", function() {
      //console.log("EVENT: resize");
      
      _this.xScale.range([_this.getMinMaxBubbleRadius().min * 2, _this.getMinMaxBubbleRadius().max * 2]);
      _this._updateSize();
      
      _this.sliderEl
        //.attr("transform", "translate(" + (sliderWidth - _this.getMinMaxBubbleRadius().max * 2) * 0.5 + "," 
        //  + (sliderHeight * 0.5) + ")")
        .call(_this.brush.extent(_this.brush.extent()))
        .call(_this.brush.event);

    });

    this._updateSize();
    this.sliderEl
      //.attr("transform", "translate(" + (sliderWidth - this.getMinMaxBubbleRadius().max * 2) * 0.5 + ","
      //   + (sliderHeight * 0.5) + ")")
      .call(this.brush.extent(values))
      .call(this.brush.event);
    
    if(this.sizeScaleMinMax) {
      this._setLabelsText();
    }    
  },
  
  ready: function() {
    var _this = this;
    
    if(_this.model.size.scale) {  
      //_this._setLabelsText()
    }
  },
  
  getMinMaxBubbleRadius: function() {
    return { min: profiles[this.getLayoutProfile()].minRadius, max: profiles[this.getLayoutProfile()].maxRadius};    
  },
  
  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  _updateSize: function() {
    var _this = this;

      _this.sliderSvg
        .attr("height", _this.getMinMaxBubbleRadius().max * 2 + _this.padding.top + _this.padding.bottom)
        .attr("width", _this.getMinMaxBubbleRadius().max * 2 + _this.padding.left + _this.padding.right)
      _this.sliderWrap
        .attr("transform", "translate(" + _this.padding.left + "," + (_this.getMinMaxBubbleRadius().max * 2 + _this.padding.top + _this.padding.bottom) * 0.5 + ")")
  },
  //slideHandler: function () {
  //  this._setValue(+d3.event.target.value);
  //},

  _setLabelsText: function() {
      var _this = this;
      _this.sliderLabelsEl
        .data([_this.model.size.tickFormatter(_this.sizeScaleMinMax[0]),_this.model.size.tickFormatter(_this.sizeScaleMinMax[1])])
        .text(function (d) { return d; });    
  },
  
  /**
   * Sets the current value in model. avoid updating more than once in framerate
   * @param {number} value
   */
  _setValue: function (value) {
    var frameRate = 50;

    //implement throttle
    //TODO: use utils.throttle
    var now = new Date();
    if (this._updTime != null && now - this._updTime < frameRate) return;
    this._updTime = now;

    this.model.size.min = value[0];
    this.model.size.max = value[1];
  }

});

export default BubbleSize;
