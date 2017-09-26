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

    const options = utils.extend({}, OPTIONS);
    this.options = utils.extend(options, this.options || {});
    const profiles = utils.extend({}, PROFILES);
    this.profiles = utils.extend(profiles, this.profiles || {});

    //this.template = this.template || require("./brushslider.html");

    this.slider_properties = config.properties || {};
    const roundDigits = this.slider_properties.roundDigits;
    if (roundDigits || roundDigits == 0) {
      this.options.ROUND_DIGITS = roundDigits;
    }
    if (this.slider_properties.domain) {
      this.options.EXTENT_MIN = this.slider_properties.domain[0];
      this.options.EXTENT_MAX = this.slider_properties.domain[1];
    }

    this._super(config, context);
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce() {
    const _this = this;
    this._super();

    const options = this.options;

    const barWidth = options.BAR_WIDTH;
    const thumbHeight = options.THUMB_HEIGHT;

    this.padding.top = (thumbHeight + options.THUMB_STROKE_WIDTH) * 0.5;
    this.padding.bottom = (thumbHeight + options.THUMB_STROKE_WIDTH) * 0.5 - barWidth;

    let componentWidth = this._getComponentWidth();
    if (componentWidth < 0) componentWidth = 0;

    this.rescaler.domain(this.slider_properties.domain || [this.options.EXTENT_MIN, this.options.EXTENT_MAX]);
    this.rescaler.range(d3.range(0, componentWidth, componentWidth / (this.rescaler.domain().length - 1)).concat([componentWidth]));

    this.sliderEl
      .call(this.brush.handleSize(options.THUMB_HEIGHT + options.THUMB_STROKE_WIDTH));

    this.sliderEl.selectAll(".w").classed("vzb-hidden", true);
    this.sliderEl.select(".selection").classed("vzb-hidden", true);

    this.sliderEl.select(".overlay")
      .lower()
      .style("stroke-opacity", "0")
      .style("stroke-width", (thumbHeight * 0.5) + "px")
      .attr("rx", barWidth * 0.5)
      .attr("ry", barWidth * 0.5);

    this.sliderEl.selectAll(".vzb-slider-thumb-badge")
      .style("stroke-width", this.options.THUMB_STROKE_WIDTH + "px");

  },

  _getBrushEventListeners() {
    const _this = this;
    const _superListeners = this._super();

    return {
      start: _superListeners.start,
      brush: (...args) => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        if (!_this.slider_properties.suppressInput) {
          _superListeners.brush(...args);
        } else {
          _this._snap(d3.event.selection);
        }
      },
      end: () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        if (_this.slider_properties.snapValue) {
          this._snap(d3.event.selection);
        }
        _this._setFromExtent(true, true); // force a persistent change
      }
    };
  },

  _snap(selection) {
    let value = this.rescaler.invert(this._extentToValue(selection));
    const domain = this.rescaler.domain();
    const ascendingDomain = domain[domain.length - 1] > domain[0];
    const next = d3.bisector(d3[ascendingDomain ? "ascending" : "descending"]).left(domain, value) || 1;
    value = (ascendingDomain ? 1 : -1) * ((value - domain[next - 1]) - (domain[next] - value)) > 0 ? domain[next] : domain[next - 1];
    this._moveBrush(this._valueToExtent(value));
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

  _resize() {
    this._super();

    const componentWidth = this._getComponentWidth();
    this.rescaler.range(d3.range(0, componentWidth || 1, (componentWidth / (this.rescaler.domain().length - 1)) || 1).concat([componentWidth]));
  },

  _valueToExtent(value) {
    return [this.rescaler.domain()[0], value];
  },

  _extentToValue(extent) {
    return extent[1];
  },

  _setModel(value, force, persistent) {
    if (this.slider_properties.suppressInput) {
      const _value = this._extentToValue(value).toFixed(this.options.ROUND_DIGITS);
      if (_value == this.model.submodel[this.arg]) return;
    }
    this._super(value, force, persistent);
  }
});

export default SingleHandleSlider;
