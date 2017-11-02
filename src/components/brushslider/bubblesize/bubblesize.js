import * as utils from "base/utils";
import BrushSlider from "components/brushslider/brushslider";

/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

const OPTIONS = {
  TEXT_PARAMS: { TOP: 11, LEFT: 10, MAX_WIDTH: 42, MAX_HEIGHT: 16 },
  THUMB_STROKE_WIDTH: 4
};

const PROFILES = {
  "small": {
    minRadiusPx: 0.5,
    maxRadiusEm: 0.05
  },
  "medium": {
    minRadiusPx: 1,
    maxRadiusEm: 0.05
  },
  "large": {
    minRadiusPx: 1,
    maxRadiusEm: 0.05
  }
};


const BubbleSize = BrushSlider.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init(config, context) {

    this.name = "bubblesize";

    const options = utils.extend({}, OPTIONS);
    this.options = utils.extend(options, this.options || {});
    const profiles = utils.extend({}, PROFILES);
    this.profiles = utils.extend(profiles, this.profiles || {});

    //this.template = this.template || require("./bubblesize.html");


    this.model_expects = [{
      name: "submodel",
      type: "size"
    }, {
      name: "locale",
      type: "locale"
    }];

    const _this = this;

    this.changeHandler = this.changeHandler.bind(this);
    this.readyHandler = this.readyHandler.bind(this);

    this.model_binds = {
      "change:submodel.domainMin": this.changeHandler,
      "change:submodel.domainMax": this.changeHandler
    };

    this._setModel = utils.throttle(this._setModel, 50);
    //contructor is the same as any component
    this._super(config, context);
  },

  changeHandler(evt, path) {
    const extent = this.model.submodel.extent || [this.options.EXTENT_MIN, this.options.EXTENT_MAX];
    this._updateLabels(extent);
    this._super(evt, path);
  },

  readyHandler(evt) {
    this._super(evt);
    this.sizeScaleMinMax = this.model.submodel.getScale().domain();
    this._setLabelsText();
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce() {
    const _this = this;
    this._super();

    this.showArcs = _this.model.submodel.showArcs !== false;

    this.padding.bottom = this.options.BAR_WIDTH + this.options.TEXT_PARAMS.MAX_HEIGHT;

    //For return to round thumbs
    //var thumbArc = d3.arc()
    //  .outerRadius(thumbHeight * 0.5)
    //  .startAngle(0)
    //  .endAngle(2 * Math.PI)

    //For return to circles
    //.attr("d", "M0 0 l" + thumbHeight + " " + (-thumbHeight * 0.5) + "v" + thumbHeight + "Z")

    //For return to round thumbs
    //.attr("d", thumbArc)

    if (_this.showArcs) {
      this.sliderEl.selectAll(".vzb-bs-slider-thumb-arc").data([0, 0]).enter()
        .append("path")
        .attr("class", "vzb-bs-slider-thumb-arc");
    }

    this.sliderArcsEl = this.sliderEl.selectAll(".vzb-bs-slider-thumb-arc");

    this.sliderLabelsWrapperEl = this.sliderEl.append("g");
    this.sliderLabelsWrapperEl.selectAll("text").data([0, 0]).enter()
      .append("text")
      .attr("class", "vzb-bs-slider-thumb-label")
      .attr("text-anchor", (d, i) => i ? "start" : "end")
      .attr("dy", (d, i) => i ? "-0.7em" : "1.4em");

    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-bs-slider-thumb-label");

    //For return to circles
    // var circleLabelTransform = function(d, i) {
    //    var dX = i ? textMargin.h + _this.xScale(d) : -textMargin.h,
    //        dY = -textMargin.v;
    //    return "translate(" + (dX) + "," + (dY) + ")";
    // }

    //const extent = _this.model.submodel.extent || [options.EXTENT_MIN, options.EXTENT_MAX];
    //this._moveBrush(extent);

    this.sizeScaleMinMax = this.model.submodel.getScale().domain();

    if (this.sizeScaleMinMax) {
      this._setLabelsText();
    }
  },

  ready() {
    this._super();
    this._updateLabels();
  },

  getMinMaxBubbleRadius() {
    const containerWH = this.root.getVizWidthHeight();
    const minWH = utils.hypotenuse(containerWH.width, containerWH.height);

    const min = this.profiles[this.getLayoutProfile()].minRadiusPx;
    let max = this.profiles[this.getLayoutProfile()].maxRadiusEm * minWH;
    if (min > max) max = min;

    return { min, max };
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  _updateSize() {
    this._super();
    this.sliderLabelsWrapperEl
      .attr("transform", this.isRTL ? "scale(-1,1)" : null);
    this.sliderLabelsEl
      .attr("text-anchor", (d, i) => (this.isRTL ? !i : i) ? "start" : "end");
  },

  _resize() {
    const minMaxBubbleRadius = this.getMinMaxBubbleRadius();
    const padding = this.element.node().offsetWidth - minMaxBubbleRadius.max * 2;
    this.padding.top = minMaxBubbleRadius.max + this.options.BAR_WIDTH,
    this.padding.left = padding * 0.5;
    this.padding.right = padding * 0.5;
    this.rescaler.range([minMaxBubbleRadius.min * 2, minMaxBubbleRadius.max * 2]);

    this._super();
  },

  _getComponentWidth() {
    return this.getMinMaxBubbleRadius().max * 2;
  },

  _updateThumbs(extent) {
    this._updateArcs(extent);
    this._updateLabels(extent);
  },

  _updateArcs(s) {
    if (!this.showArcs) return;
    const _this = this;
    const valueArc = d3.arc()
      .outerRadius(d => _this.rescaler(d) * 0.5)
      .innerRadius(d => _this.rescaler(d) * 0.5)
      .startAngle(-Math.PI * 0.5)
      .endAngle(Math.PI * 0.5);
    this.sliderArcsEl.data(s)
      .attr("d", valueArc)
      .attr("transform", d => "translate(" + (_this.rescaler(d) * 0.5) + ",0)");
  },

  _updateLabels(s) {
    const _this = this;
    if (s) { this.sliderLabelsEl.data(s); }
    this.sliderLabelsEl
      .attr("transform", (d, i) => {
        const textMargin = { v: this.options.TEXT_PARAMS.TOP, h: this.options.TEXT_PARAMS.LEFT };
        const dX = textMargin.h * (i ? 0.5 : -1.0) + _this.rescaler(d);
        const dY = 0;
        return "translate(" + ((_this.isRTL ? -1 : 1) * dX) + "," + (dY) + ")";
      });
  },

  _setLabelsText() {
    const _this = this;
    const texts = [_this.model.submodel.getTickFormatter()(_this.sizeScaleMinMax[0]), _this.model.submodel.getTickFormatter()(_this.sizeScaleMinMax[1])];
    _this.sliderLabelsEl
      .text((d, i) => texts[i]);
  }

});

export default BubbleSize;
