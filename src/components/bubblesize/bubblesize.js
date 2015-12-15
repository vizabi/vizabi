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
  TEXT_PARAMS: { TOP: 18, LEFT: 10, MAX_WIDTH: 42, MAX_HEIGHT: 16 },
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
      'change:size.min': changeMinMaxHandler,
      'change:size.max': changeMinMaxHandler,
      'ready': readyHandler
    };

    function changeMinMaxHandler(evt, path) {
        var size = [
            _this.model.size[_this.fields.min],
            _this.model.size[_this.fields.max]
        ];
        _this._updateArcs(size);
        _this._updateLabels(size);
        _this.sliderEl.call(_this.brush.extent(size));
    }
    function readyHandler(evt) {
        _this.sizeScaleMinMax = _this.model.size.getScale().domain();
        _this._setLabelsText();
    }

    this._setModel = utils.throttle(this._setModel, 50);
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
      textMargin = { v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT },
      textMaxWidth = OPTIONS.TEXT_PARAMS.MAX_WIDTH,
      textMaxHeight = OPTIONS.TEXT_PARAMS.MAX_HEIGHT,
      barWidth = OPTIONS.BAR_WIDTH,
      thumbRadius = OPTIONS.THUMB_RADIUS,
      thumbStrokeWidth = OPTIONS.THUMB_STROKE_WIDTH,
      padding = {
        top: thumbStrokeWidth,
        left: textMargin.h + textMaxWidth,
        right: textMargin.h + textMaxWidth,
        bottom: barWidth + textMaxHeight
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
        _this._setFromExtent(false, false); // non persistent change
      })
      .on("brushend", function () {
         _this.sliderEl.selectAll(".resize")
          .style("display", null)

        _this._setFromExtent(true); // force a persistent change
      });

    this.sliderEl
      .call(_this.brush);

    //For return to round thumbs
    //var thumbArc = d3.svg.arc()
    //  .outerRadius(thumbRadius)
    //  .startAngle(0)
    //  .endAngle(2 * Math.PI)

    this.sliderThumbs = this.sliderEl.selectAll(".resize").sort(d3.descending)
      .classed("vzb-bs-slider-thumb", true)

    this.sliderThumbs.append("g")
      .attr("class", "vzb-bs-slider-thumb-badge")
      .append("path")
      .attr("d", "M0 " + (barWidth * .5) + "l" + (-thumbRadius) + " " + (thumbRadius * 1.5) + "h" + (thumbRadius * 2) + "Z")

      //For return to circles
      //.attr("d", "M0 0 l" + (thumbRadius * 2) + " " + (-thumbRadius) + "v" + (thumbRadius * 2) + "Z")

      //For return to round thumbs
      //.attr("d", thumbArc)

    this.sliderThumbs.append("path")
      .attr("class", "vzb-bs-slider-thumb-arc")
    this.sliderEl.selectAll("text").data([0,0]).enter()
      .append("text")
      .attr("class", "vzb-bs-slider-thumb-label")
      .attr("dy", "0.35em")
      .attr("text-anchor", function(d, i) {
        return i ? "start" : "end"})
      .attr("dominant-baseline", function(d, i) {
        return i ? "text-after-edge" : "text-before-edge"})

    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-bs-slider-thumb-label");

    this.sliderEl.selectAll("rect")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")")
    this.sliderEl.select(".extent")
      .classed("vzb-bs-slider-extent", true)

    //For return to circles
    // var circleLabelTransform = function(d, i) {
    //    var dX = i ? textMargin.h + _this.xScale(d) : -textMargin.h,
    //        dY = -textMargin.v;
    //    return "translate(" + (dX) + "," + (dY) + ")";
    // }

    this.on("resize", function() {
      //console.log("EVENT: resize");

      _this.xScale.range([_this.getMinMaxBubbleRadius().min * 2, _this.getMinMaxBubbleRadius().max * 2]);
      _this._updateSize();

      _this.sliderEl
        .call(_this.brush.extent(_this.brush.extent()))
        .call(_this.brush.event);

    });

    this._updateSize();
    this.sliderEl
      .call(this.brush.extent(values))
      .call(this.brush.event);

    _this.sizeScaleMinMax = _this.model.size.getScale().domain();

    if(_this.sizeScaleMinMax) {
      _this._setLabelsText();
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
    this.sliderSvg
      .attr("height", this.getMinMaxBubbleRadius().max + this.padding.top + this.padding.bottom)
      .attr("width", this.getMinMaxBubbleRadius().max * 2 + this.padding.left + this.padding.right)
    this.sliderWrap
      .attr("transform", "translate(" + this.padding.left + "," + (this.getMinMaxBubbleRadius().max + this.padding.top) + ")")
  },

  _updateArcs: function(s) {
    var _this = this;
    var valueArc = d3.svg.arc()
      .outerRadius(function (d) { return _this.xScale(d) * 0.5 })
      .innerRadius(function (d) { return _this.xScale(d) * 0.5 })
      .startAngle(-Math.PI * 0.5)
      .endAngle(Math.PI * 0.5);

    this.sliderThumbs.select('.vzb-bs-slider-thumb-arc').data(s)
      .attr("d", valueArc)
      .attr("transform", function (d) { return "translate(" + (-_this.xScale(d) * 0.5) + ",0)"; })
  },

  _updateLabels: function(s) {
    var _this = this;
    var arcLabelTransform = function(d, i) {      
      var textMargin = { v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT },
          dX = textMargin.h * (i ? .5 : -1.0) + _this.xScale(d),
          dY = i ? -textMargin.v : 0;
       return "translate(" + (dX) + "," + (dY) + ")";
    }
    this.sliderLabelsEl.data(s)
      .attr("transform", arcLabelTransform);
  },

  _setLabelsText: function() {
      var _this = this;
      _this.sliderLabelsEl
        .data([_this.model.size.tickFormatter(_this.sizeScaleMinMax[0]),_this.model.size.tickFormatter(_this.sizeScaleMinMax[1])])
        .text(function (d) { return d; });
  },

  /**
   * Prepares setting of the current model with the values from extent.
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setFromExtent: function(force, persistent) {
    var s = this.brush.extent();
    this._updateArcs(s);
    this._updateLabels(s);
    this._setModel(s, force, persistent);
  },

  /**
   * Sets the current value in model. avoid updating more than once in framerate
   * @param {number} value
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setModel: function (value, force, persistent) {
    var _this = this;
    _this.model.size.getModelObject('min').set(value[0], force, persistent);
    _this.model.size.getModelObject('max').set(value[1], force, persistent);
  }

});

export default BubbleSize;
