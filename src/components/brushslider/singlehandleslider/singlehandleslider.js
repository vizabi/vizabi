import * as utils from "base/utils";
import BrushSlider from "components/brushslider/brushslider";


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

const OPTIONS = {
  THUMB_HEIGHT: 17,
  THUMB_STROKE_WIDTH: 3
};

const PROFILES = {
  "small": {
  },
  "medium": {
  },
  "large": {
  }
};


const SingleHandleSlider = BrushSlider.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init(config, context) {
    const _this = this;

    this.name = "singlehandleslider";

    this.options = utils.extend(OPTIONS, {});
    this.profiles = utils.extend(PROFILES, {});

    //this.template = this.template || require("./brushslider.html");

    this.thumb_size = config.thumb_size;
    this.slider_properties = config.properties;

    this._super(config, context);
  },

  readyHandler(evt) {
    this.sliderEl.selectAll(".w").classed("vzb-hidden", true);
    this.sliderEl.select(".selection").classed("vzb-hidden", true);
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce() {
    const _this = this;
    this.options.EXTENT_MIN = this.slider_properties.scale.range()[0];
    this.options.EXTENT_MAX = this.slider_properties.scale.range()[1];

    this._super();

    const options = this.options;

    const barWidth = options.BAR_WIDTH;
    const thumbHeight = options.THUMB_HEIGHT;

    this.padding.top = (thumbHeight + options.THUMB_STROKE_WIDTH) * 0.5;
    this.padding.bottom = (thumbHeight + options.THUMB_STROKE_WIDTH) * 0.5 - barWidth;

    let componentWidth = this._getComponentWidth();
    if (componentWidth < 0) componentWidth = 0;

    this.rescaler
      .domain(this.slider_properties.scale.range())
      .range(d3.range(0, componentWidth, componentWidth / (this.slider_properties.scale.range().length - 1)).concat([componentWidth]));

    this.sliderEl
      .call(this.brush.handleSize(options.THUMB_HEIGHT + options.THUMB_STROKE_WIDTH));

    this.sliderEl.select(".overlay")
      .lower()
      .style("stroke-opacity", "0")
      .style("stroke-width", (thumbHeight * 0.5) + "px")
      .attr("rx", barWidth * 0.5)
      .attr("ry", barWidth * 0.5);

    this.sliderEl.selectAll(".vzb-slider-thumb-badge")
      .style("stroke-width", this.options.THUMB_STROKE_WIDTH + "px");

  },

  _createThumbs(thumbsEl) {
    const barWidth = this.options.BAR_WIDTH;
    const halfThumbHeight = this.options.THUMB_HEIGHT * 0.5;

    const thumbArc = d3.arc()
      .outerRadius(halfThumbHeight)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    thumbsEl
      .attr("transform", "translate(" + (halfThumbHeight + this.options.THUMB_STROKE_WIDTH * 0.5) + "," + (halfThumbHeight + this.options.THUMB_STROKE_WIDTH * 0.5) + ")")
      .append("path")
      .attr("d", thumbArc);
  },

  _valueToExtent(value) {
    return [this.rescaler.domain()[0], value];
  },

  _extentToValue(extent) {
    return extent[1];
  },

});

export default SingleHandleSlider;
