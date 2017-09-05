import * as utils from "base/utils";
import Component from "base/component";


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

const OPTIONS = {
  EXTENT_MIN: 0,
  EXTENT_MAX: 1,
  BAR_WIDTH: 6,
  THUMB_HEIGHT: 20,
  THUMB_STROKE_WIDTH: 4,
  INTRO_DURATION: 250,
  ROUND_DIGITS: 2
};

const PROFILES = {
  "small": {
  },
  "medium": {
  },
  "large": {
  }
};


const BrushSlider = Component.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init(config, context) {
    const _this = this;

    this.name = this.name || "brushslider";

    const options = utils.extend({}, OPTIONS);
    this.options = utils.extend(options, this.options || {});
    const profiles = utils.extend({}, PROFILES);
    this.profiles = utils.extend(profiles, this.profiles || {});

    this.template = this.template || require("./brushslider.html");

    this.arg = config.arg || "extent";

    this.model_expects = this.model_expects ||
      [{
        name: "submodel"
      }, {
        name: "locale",
        type: "locale"
      }];

    this.model_binds = this.model_binds || {};
    if (!this.model_binds["ready"]) {
      this.model_binds["ready"] = this.readyHandler.bind(this);
    }
    if (!this.model_binds["change:submodel." + this.arg]) {
      this.model_binds["change:submodel." + this.arg] = this.changeHandler.bind(this);
    }

    this._setModel = utils.throttle(this._setModel, 50);
    //contructor is the same as any component
    this._super(config, context);
  },

  changeHandler(evt, path) {
    const extent = this._valueToExtent(this.model.submodel[this.arg]) || [this.options.EXTENT_MIN, this.options.EXTENT_MAX];
    this._moveBrush(extent);
  },

  readyHandler(evt) {
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce() {
    const _this = this;

    this.element = d3.select(this.element);
    this.sliderSvg = this.element.select(".vzb-slider-svg");
    this.sliderWrap = this.sliderSvg.select(".vzb-slider-wrap");
    this.sliderEl = this.sliderWrap.select(".vzb-slider").classed("vzb-slider-" + this.name, true);
    const options = this.options;

    const barWidth = options.BAR_WIDTH;
    const halfThumbHeight = options.THUMB_HEIGHT * 0.5;

    const padding = this.padding = {
      top: barWidth * 0.5,
      left: halfThumbHeight,
      right: halfThumbHeight,
      bottom: halfThumbHeight + options.THUMB_STROKE_WIDTH
    };

    let componentWidth = this._getComponentWidth() || 0;
    if (componentWidth < 0) componentWidth = 0;

    this.rescaler = d3.scaleLinear()
      .domain([options.EXTENT_MIN, options.EXTENT_MAX])
      .range([0, componentWidth])
      .clamp(true);

    this.brushEventListeners = this._getBrushEventListeners();

    this.brush = d3.brushX()
      .handleSize(halfThumbHeight * 2 + barWidth * 2)
      .on("start", this.brushEventListeners.start)
      .on("brush", this.brushEventListeners.brush)
      .on("end", this.brushEventListeners.end);

    this.sliderThumbs = this.sliderEl.selectAll(".handle")
      .data([{ type: "w" }, { type: "e" }], d => d.type)
      .enter().append("svg").attr("class", d => "handle handle--" + d.type + " " + d.type)
      .classed("vzb-slider-thumb", true);

    this._createThumbs(
      this.sliderThumbs.append("g")
        .attr("class", "vzb-slider-thumb-badge")
    );

    this.sliderEl
      .call(_this.brush);

    this.sliderEl.selectAll(".selection,.overlay")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")");

    this.on("resize", () => {
      _this._resize();
      _this._updateView();
    });

  },

  ready() {
    this.isRTL = this.model.locale.isRTL();
    this._resize();
    this._updateView();
  },

  _getBrushEventListeners() {
    const _this = this;

    return {
      start: () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        if (d3.event.selection && d3.event.selection[0] == d3.event.selection[1]) {
          const brushDatum = _this.sliderEl.node().__brush;
          brushDatum.selection[1][0] += 0.01;
        }
        _this._setFromExtent(false, false, false);
      },
      brush: () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        if (d3.event.selection && d3.event.selection[0] == d3.event.selection[1]) {
          const brushDatum = _this.sliderEl.node().__brush;
          brushDatum.selection[1][0] += 0.01;
        }
        _this._setFromExtent(true, false, false); // non persistent change
      },
      end: () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        _this._setFromExtent(true, true); // force a persistent change
      }
    };
  },

  _createThumbs(thumbsEl) {
    const barWidth = this.options.BAR_WIDTH;
    const halfThumbHeight = this.options.THUMB_HEIGHT * 0.5;
    thumbsEl.append("path")
      .attr("d", "M" + (halfThumbHeight + barWidth) + " " + (halfThumbHeight + barWidth * 1.5) + "l" + (-halfThumbHeight) + " " + (halfThumbHeight * 1.5) + "h" + (halfThumbHeight * 2) + "Z");
  },

  _updateThumbs(extent) {

  },

  _updateSize() {
    const svgWidth = this._getComponentWidth() + this.padding.left + this.padding.right;

    this.sliderSvg
      .attr("height", this._getComponentHeight() + this.padding.top + this.padding.bottom)
      .attr("width", svgWidth);
    this.sliderWrap
      .attr("transform", this.isRTL ? "translate(" + (svgWidth - this.padding.right) + "," + this.padding.top + ") scale(-1,1)" :
        "translate(" + this.padding.left + "," + this.padding.top + ")");
  },
  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  _resize() {
    this._updateSize();

    const componentWidth = this._getComponentWidth();
    this.rescaler.range([0, componentWidth]);
  },

  _getComponentWidth() {
    const width = this.element.node().offsetWidth - this.padding.left - this.padding.right;
    return width < 0 ? 0 : width;
  },

  _getComponentHeight() {
    return this.options.BAR_WIDTH;
  },

  _updateView() {
    this.sliderEl.call(this.brush.extent([[0, 0], [this._getComponentWidth(), this._getComponentHeight()]]));
    const extent = this._valueToExtent(this.model.submodel[this.arg]) || [this.options.EXTENT_MIN, this.options.EXTENT_MAX];
    this._moveBrush(extent);
  },

  _moveBrush(s) {
    const _s = s.map(this.rescaler);
    this.nonBrushChange = true;
    this.sliderEl.call(this.brush.move, [_s[0], _s[1] + 0.01]);
    this.nonBrushChange = false;
    this._setFromExtent(false, false, false);
  },

  _valueToExtent(value) {
    return value;
  },

  _extentToValue(extent) {
    return extent;
  },

  /**
   * Prepares setting of the current model with the values from extent.
   * @param {boolean} set model
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setFromExtent(setModel, force, persistent) {
    let s = d3.brushSelection(this.sliderEl.node());
    if (!s) return;
    s = [this.rescaler.invert(s[0]), this.rescaler.invert(+s[1].toFixed(1))];
    this._updateThumbs(s);
    if (setModel) this._setModel(s, force, persistent);
  },

  /**
   * Sets the current value in model. avoid updating more than once in framerate
   * @param {number} value
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setModel(value, force, persistent) {
    const roundDigits = this.options.ROUND_DIGITS;
    value = [+value[0].toFixed(roundDigits), +value[1].toFixed(roundDigits)];
    const newValue = {};
    newValue[this.arg] = this._extentToValue(value);
    this.model.submodel.set(newValue, force, persistent);
  }

});

export default BrushSlider;
