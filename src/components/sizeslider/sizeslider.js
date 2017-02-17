import * as utils from "base/utils";
import Component from "base/component";


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

const OPTIONS = {
  EXTENT_MIN: 0,
  EXTENT_MAX: 1,
  TEXT_PARAMS: { TOP: 18, LEFT: 10, MAX_WIDTH: 42, MAX_HEIGHT: 16 },
  BAR_WIDTH: 6,
  THUMB_RADIUS: 10,
  THUMB_STROKE_WIDTH: 4,
  INTRO_DURATION: 250,
  MARGIN: { TOP: 2, LEFT: 5, RIGHT: 5 }
};

const profiles = {
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


const SizeSlider = Component.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init(config, context) {

    this.name = "sizeslider";

    this.template = this.template || require("./sizeslider.html");

    this.propertyName = config.propertyname;

    this.model_expects = [{
      name: "size",
      type: "size"
    }, {
      name: "locale",
      type: "locale"
    }];

    const _this = this;
    this.model_binds = {
      "change:size.domainMin": changeMinMaxHandler,
      "change:size.domainMax": changeMinMaxHandler,
      "change:size.extent": changeMinMaxHandler,
      "ready": function() {
        _this.modelReady();
      }
    };

    function changeMinMaxHandler(evt, path) {
      const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
      _this._updateLabels(extent);
      _this._moveBrush(extent);
    }

    this._setModel = utils.throttle(this._setModel, 50);
    //contructor is the same as any component
    this._super(config, context);
  },

  modelReady() {
    const _this = this;
    _this.modelUse = _this.model.size.use;
    const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
    if (_this.modelUse != "constant") {
      _this.sizeScaleMinMax = _this.model.size.getScale().domain();
      _this.sliderEl.selectAll(".w").classed("vzb-hidden", false);
      _this.sliderEl.select(".selection").classed("vzb-hidden", false);
      _this.sliderEl.select(".overlay").classed("vzb-pointerevents-none", false);
      _this._setLabelsText();
    } else {
      _this.sliderEl.selectAll(".w").classed("vzb-hidden", true);
      _this.sliderEl.select(".selection").classed("vzb-hidden", true);
      _this.sliderEl.select(".overlay").classed("vzb-pointerevents-none", true);
      if (!_this.model.size.which) {
        const p = _this.propertyActiveProfile;
        extent[1] = (p.default - p.min) / (p.max - p.min);
        _this.model.size.which = "_default";
      }
    }
    _this._moveBrush(extent);
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce() {
    const _this = this;
    const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
    this.element = d3.select(this.element);
    this.sliderSvg = this.element.select(".vzb-szs-svg");
    this.sliderWrap = this.sliderSvg.select(".vzb-szs-slider-wrap");
    this.sliderEl = this.sliderWrap.select(".vzb-szs-slider");

    const  textMargin = { v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT };
    const textMaxWidth = OPTIONS.TEXT_PARAMS.MAX_WIDTH;
    const textMaxHeight = OPTIONS.TEXT_PARAMS.MAX_HEIGHT;
    const barWidth = OPTIONS.BAR_WIDTH;
    const thumbRadius = OPTIONS.THUMB_RADIUS;
    const thumbStrokeWidth = OPTIONS.THUMB_STROKE_WIDTH;
    const padding = {
      top: OPTIONS.MARGIN.TOP + barWidth * 1.25,
      left: thumbRadius,
      right: thumbRadius,
      bottom: barWidth + textMaxHeight
    };

    const componentWidth = this.element.node().offsetWidth;

    this.padding = padding;

    this.propertyActiveProfile = this.getPropertyActiveProfile();
    this.translator = this.model.locale.getTFunction();

    this.propertyScale = d3.scale.linear()
      .domain([OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX])
      .range([this.propertyActiveProfile.min, this.propertyActiveProfile.max])
      .clamp(true);

    this.xScale = d3.scale.linear()
      .domain([OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX])
      .range([0, componentWidth - padding.left - padding.right])
      .clamp(true);

    this.brush = d3.brushX()
      .extent([[0, 0], [componentWidth - padding.left - padding.right, barWidth]])
      .handleSize(thumbRadius * 2 + barWidth * 2)
      .on("start", () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        if (d3.event.selection && d3.event.selection[0] == d3.event.selection[1]) {
          const brushDatum = _this.sliderEl.node().__brush;
          brushDatum.selection[1][0] += 0.01;
        }
        _this._setFromExtent(false, false, false);
      })
      .on("brush", () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        if (d3.event.selection && d3.event.selection[0] == d3.event.selection[1]) {
          const brushDatum = _this.sliderEl.node().__brush;
          brushDatum.selection[1][0] += 0.01;
        }
        _this._setFromExtent(true, false, false); // non persistent change
      })
      .on("end", () => {
        if (_this.nonBrushChange || !d3.event.sourceEvent) return;
        _this._setFromExtent(true, true); // force a persistent change
      });

    this.sliderThumbs = this.sliderEl.selectAll(".handle")
      .data([{ type: "w" }, { type: "e" }], d => d.type)
      .enter().append("svg").attr("class", d => "handle handle--" + d.type + " " + d.type)
      .classed("vzb-szs-slider-thumb", true);

    this.sliderThumbs.append("g")
      .attr("class", "vzb-szs-slider-thumb-badge")
      .append("path")
      .attr("d", "M" + (thumbRadius + barWidth) + " " + (thumbRadius + barWidth * 1.5) + "l" + (-thumbRadius) + " " + (thumbRadius * 1.5) + "h" + (thumbRadius * 2) + "Z");

    this.sliderEl
      .call(_this.brush);

    this.sliderEl.selectAll("text").data([0, 0]).enter()
      .append("text")
      .attr("class", (d, i) => "vzb-szs-slider-thumb-label " + (i ? "e" : "w"))
      .attr("dy", (-barWidth * 1.25) + "px")
      .attr("text-anchor", (d, i) => 1 - i ? "start" : "end");

    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-szs-slider-thumb-label");

    this.sliderEl.selectAll(".selection,.overlay")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")");
    this.sliderEl.select(".extent")
      .classed("vzb-szs-slider-extent", true);

    this.on("resize", () => {
      //console.log("EVENT: resize");
      _this.propertyActiveProfile = _this.getPropertyActiveProfile();
      _this.propertyScale.range([_this.propertyActiveProfile.min, _this.propertyActiveProfile.max]);

      const componentWidth = _this.element.node().offsetWidth;

      _this.xScale.range([0, componentWidth - _this.padding.left - _this.padding.right]);
      _this._updateSize();
      _this.sliderEl.call(_this.brush.extent([[0, 0], [componentWidth - padding.left - padding.right, barWidth]]));
      const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
      _this._moveBrush(extent);
    });

    this._updateSize();
    this._moveBrush(extent);

    _this.sizeScaleMinMax = _this.model.size.getScale().domain();

    if (_this.sizeScaleMinMax) {
      _this._setLabelsText();
    }

    if (_this.model._ready) this.modelReady();
  },

  getPropertyActiveProfile() {
    const profile = profiles[this.getLayoutProfile()];
    return { min: profile["min" + this.propertyName], max: profile["max" + this.propertyName], default: profile["default" + this.propertyName] };
  },

  _moveBrush(s) {
    const _s = s.map(this.xScale);
    this.nonBrushChange = true;
    this.sliderEl.call(this.brush.move, [_s[0], _s[1] + 0.01]);
    this.nonBrushChange = false;
    this._setFromExtent(false, false, false);
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  _updateSize() {
    this.sliderSvg
      .attr("height", this.propertyActiveProfile.max + this.padding.top + this.padding.bottom)
      .attr("width", "100%");
    this.sliderWrap
      .attr("transform", "translate(" + this.padding.left + "," + (this.propertyActiveProfile.max + this.padding.top) + ")");
  },

  _updateLabels(s) {
    const _this = this;
    this.sliderLabelsEl.data(s)
      .attr("transform", (d, i) => {
        const dX = _this.xScale(i);
        const dY = 0;//i ? -textMargin.v : 0;
        return "translate(" + (dX) + "," + (dY) + ")";
      })
      .attr("font-size", (d, i) => _this.propertyScale(d));
    if (_this.model.size.use === "constant")
      this.sliderLabelsEl.text(d => ~~(_this.propertyScale(d)) + (_this.translator(_this.ui.constantUnit) || ""));
  },

  _setLabelsText() {
    const _this = this;
    _this.sliderLabelsEl
      .data([_this.model.size.getTickFormatter()(_this.sizeScaleMinMax[0]), _this.model.size.getTickFormatter()(_this.sizeScaleMinMax[1])])
      .text(d => d);
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
    s = [this.xScale.invert(s[0]), this.xScale.invert(+s[1].toFixed(1))];
    this._updateLabels(s);
    if (setModel) this._setModel(s, force, persistent);
  },

  /**
   * Sets the current value in model. avoid updating more than once in framerate
   * @param {number} value
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setModel(value, force, persistent) {
    value = [+value[0].toFixed(2), +value[1].toFixed(2)];
    this.model.size.set({ "extent": value }, force, persistent);
  }

});

export default SizeSlider;
