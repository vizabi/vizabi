import * as utils from 'base/utils';
import Component from 'base/component';


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

var OPTIONS = {
  EXTENT_MIN: 0,
  EXTENT_MAX: 1,
  TEXT_PARAMS: { TOP: 18, LEFT: 10, MAX_WIDTH: 42, MAX_HEIGHT: 16 },
  BAR_WIDTH: 6,
  THUMB_RADIUS: 10,
  THUMB_STROKE_WIDTH: 4,
  INTRO_DURATION: 250,
  MARGIN: { TOP: 2, LEFT: 5, RIGHT:5}
}

var profiles = {
    "small": {
      minLabelTextSize: 7,
      maxLabelTextSize: 21,
      defaultLabelTextSize: 12
    },
    "medium": {
      minLabelTextSize: 7,
      maxLabelTextSize: 30,
      defaultLabelTextSize: 15
    },
    "large": {
      minLabelTextSize: 6,
      maxLabelTextSize: 48,
      defaultLabelTextSize: 20
    }
};


var SizeSlider = Component.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init: function (config, context) {

    this.name = 'sizeslider';

    this.template = this.template || require('./sizeslider.html');

    this.propertyName = config.propertyname;

    this.model_expects = [{
      name: "size",
      type: "size"
    },{
      name: "locale",
      type: "locale"
    }];

    var _this = this;
    this.model_binds = {
      'change:size.domainMin': changeMinMaxHandler,
      'change:size.domainMax': changeMinMaxHandler,
      'change:size.extent': changeMinMaxHandler,
      'ready': function() {
        _this.modelReady();
      }
    };

    function changeMinMaxHandler(evt, path) {
      var size = _this.model.size.extent||[OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
      //_this._updateArcs(size);
      _this._updateLabels(size);
      _this.sliderEl.call(_this.brush.extent(size));
      if(size[0] == size[1]){
        _this.sliderEl.selectAll(".resize")
          .style("display", "block");
      }
    }

    this._setModel = utils.throttle(this._setModel, 50);
    //contructor is the same as any component
    this._super(config, context);
  },

  modelReady: function() {
    var _this = this;
    _this.modelUse = _this.model.size.use;
    var size = _this.model.size.extent||[OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
    if(_this.modelUse != 'constant') {
      _this.sizeScaleMinMax = _this.model.size.getScale().domain();
      _this.sliderEl.selectAll('.w').classed('vzb-hidden', false);
      _this.sliderEl.select('.extent').classed('vzb-hidden', false);
      _this.sliderEl.select('.background').classed('vzb-pointerevents-none', false);
      _this._setLabelsText();
    } else {
      _this.sliderEl.selectAll('.w').classed('vzb-hidden', true);
      _this.sliderEl.select('.extent').classed('vzb-hidden', true);
      _this.sliderEl.select('.background').classed('vzb-pointerevents-none', true);
      if(!_this.model.size.which) {
        var p = _this.propertyActiveProfile;
        size[1] = (p.default - p.min) / (p.max - p.min);
        _this.model.size.which = '_default';
      }
    }
    _this.sliderEl.call(_this.brush.extent([size[0], size[1]]));
    _this.sliderEl.call(_this.brush.event);
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce: function () {
    var _this = this;
    var values = _this.model.size.extent||[OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
    this.element = d3.select(this.element);
    this.sliderSvg = this.element.select(".vzb-szs-svg");
    this.sliderWrap = this.sliderSvg.select(".vzb-szs-slider-wrap");
    this.sliderEl = this.sliderWrap.select(".vzb-szs-slider");

    var
      textMargin = {v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT},
      textMaxWidth = OPTIONS.TEXT_PARAMS.MAX_WIDTH,
      textMaxHeight = OPTIONS.TEXT_PARAMS.MAX_HEIGHT,
      barWidth = OPTIONS.BAR_WIDTH,
      thumbRadius = OPTIONS.THUMB_RADIUS,
      thumbStrokeWidth = OPTIONS.THUMB_STROKE_WIDTH,
      padding = {
        top: OPTIONS.MARGIN.TOP + barWidth * 1.25,
        left: thumbRadius,
        right: thumbRadius,
        bottom: barWidth + textMaxHeight
      }

    var componentWidth = this.element.node().offsetWidth;

    this.padding = padding;

    this.propertyActiveProfile = this.getPropertyActiveProfile();
    this.translator = this.model.locale.getTFunction();

    this.propertyScale = d3.scale.linear()
      .domain([OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX])
      .range([this.propertyActiveProfile.min, this.propertyActiveProfile.max])
      .clamp(true)

    this.xScale = d3.scale.linear()
      .domain([OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX])
      .range([0, componentWidth - padding.left - padding.right])
      .clamp(true)

    this.brush = d3.svg.brush()
      .x(this.xScale)
      .extent([OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX])
      .on("brush", function () {
        _this._setFromExtent(true, false, false); // non persistent change
      })
      .on("brushend", function () {
         _this.sliderEl.selectAll(".resize")
         .style("display", null);

        _this._setFromExtent(true, true); // force a persistent change
      });

    this.sliderEl
      .call(_this.brush);

    this.sliderEl.selectAll('.background').attr('style','');

    //For return to round thumbs
    //var thumbArc = d3.svg.arc()
    //  .outerRadius(thumbRadius)
    //  .startAngle(0)
    //  .endAngle(2 * Math.PI)

    this.sliderThumbs = this.sliderEl.selectAll(".resize").sort(d3.descending)
      .classed("vzb-szs-slider-thumb", true)

    this.sliderThumbs.append("g")
      .attr("class", "vzb-szs-slider-thumb-badge")
      .append("path")
      .attr('d', function(d,i) {
        return "M0 " + (barWidth * .5) + "l" + (-thumbRadius) + " " + (thumbRadius * 1.5) + "h" + (thumbRadius * 2) + "Z";
      })

    this.sliderThumbs.append("path")
      .attr("class", "vzb-szs-slider-thumb-arc")
    this.sliderEl.selectAll("text").data([0,0]).enter()
      .append("text")
      .attr("class", function(d, i) {
        return "vzb-szs-slider-thumb-label " + (i ? 'e' : 'w');})
      .attr("dy", (-barWidth * 1.25) + 'px')
      .attr("text-anchor", function(d, i) {
        return 1 - i ? "start" : "end"})

    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-szs-slider-thumb-label");

    this.sliderEl.selectAll("rect")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")")
    this.sliderEl.select(".extent")
      .classed("vzb-szs-slider-extent", true)

    this.on("resize", function() {
      //console.log("EVENT: resize");
      _this.propertyActiveProfile = _this.getPropertyActiveProfile();
      _this.propertyScale.range([_this.propertyActiveProfile.min, _this.propertyActiveProfile.max])

      var componentWidth = _this.element.node().offsetWidth;

       _this.xScale.range([0, componentWidth - _this.padding.left - _this.padding.right])
       _this._updateSize();

       _this.sliderEl
         .call(_this.brush.extent(_this.brush.extent()))
       _this._setFromExtent(false, false, false); // non persistent change

    });

    this._updateSize();

    this.sliderEl
      .call(this.brush.extent(values))
    _this._setFromExtent(false, false, false); // non persistent change

    _this.sizeScaleMinMax = _this.model.size.getScale().domain();

    if(_this.sizeScaleMinMax) {
      _this._setLabelsText();
    }

    if(_this.model._ready) this.modelReady();
  },

  getPropertyActiveProfile: function() {
    var profile = profiles[this.getLayoutProfile()];
    return { min: profile['min' + this.propertyName], max: profile['max' + this.propertyName], default: profile['default' + this.propertyName]};
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  _updateSize: function() {
    this.sliderSvg
      .attr("height", this.propertyActiveProfile.max + this.padding.top + this.padding.bottom)
      .attr("width", '100%')
    this.sliderWrap
      .attr("transform", "translate(" + this.padding.left + "," + (this.propertyActiveProfile.max + this.padding.top) + ")")
  },

//   _updateArcs: function(s) {
//     var _this = this;
//     var valueArc = d3.svg.arc()
//       .outerRadius(function (d) { return _this.xScale(d) * 0.5 })
//       .innerRadius(function (d) { return _this.xScale(d) * 0.5 })
//       .startAngle(-Math.PI * 0.5)
//       .endAngle(Math.PI * 0.5);
//
//     this.sliderThumbs.select('.vzb-szs-slider-thumb-arc').data(s)
//       .attr("d", valueArc)
//       .attr("transform", function (d) {return "translate(" + (-_this.xScale(d) * 0.25) + ",0)"; })
//   },
//
  _updateLabels: function(s) {
    var _this = this;
    var arcLabelTransform = function(d, i) {
      var dX = _this.xScale(i),
          dY = 0;//i ? -textMargin.v : 0;
      return "translate(" + (dX) + "," + (dY) + ")";
    }
    this.sliderLabelsEl.data(s)
      .attr("transform", arcLabelTransform)
      .attr("font-size", function(d, i) {
        return _this.propertyScale(d);
      })
    if(_this.model.size.use === 'constant')
      this.sliderLabelsEl.data(s).text(function(d) {
        return ~~(_this.propertyScale(d)) + (_this.translator(_this.ui.constantUnit)||"");
      })
  },

  _setLabelsText: function() {
      var _this = this;
      _this.sliderLabelsEl
        .data([_this.model.size.getTickFormatter()(_this.sizeScaleMinMax[0]),_this.model.size.getTickFormatter()(_this.sizeScaleMinMax[1])])
        .text(function (d) { return d; });
  },

  /**
   * Prepares setting of the current model with the values from extent.
   * @param {boolean} set model
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setFromExtent: function(setModel, force, persistent) {
    var s = this.brush.extent();
//    this._updateArcs(s);
    this._updateLabels(s);
    if(setModel) this._setModel(s, force, persistent);
  },

  /**
   * Sets the current value in model. avoid updating more than once in framerate
   * @param {number} value
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setModel: function (value, force, persistent) {
    value = [+value[0].toFixed(2), +value[1].toFixed(2)];
    this.model.size.set({"extent": value}, force, persistent);
  }

});

export default SizeSlider;
