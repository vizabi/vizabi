import * as utils from "base/utils";
import Component from "base/component";


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

const OPTIONS = {
  EXTENT_MIN: 0,
  EXTENT_MAX: 1,
  TEXT_PARAMS: { TOP: 11, LEFT: 10, MAX_WIDTH: 42, MAX_HEIGHT: 16 },
  BAR_WIDTH: 6,
  THUMB_RADIUS: 10,
  THUMB_STROKE_WIDTH: 4,
  INTRO_DURATION: 250
};

const profiles = {
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
    maxRadius: 65
  }
};


const BubbleSize = Component.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init(config, context) {

    this.name = "bubblesize";

    this.template = this.template || require("./bubblesize.html");

    this.model_expects = [{
      name: "size",
      type: "size"
    }];

    const _this = this;
    this.model_binds = {
      "change:size.domainMin": changeMinMaxHandler,
      "change:size.domainMax": changeMinMaxHandler,
      "change:size.extent": changeMinMaxHandler,
      "ready": readyHandler
    };

    function changeMinMaxHandler(evt, path) {
      const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
      _this._updateLabels(extent);
      _this._moveBrush(extent);
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
  readyOnce() {
    const _this = this;
    const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
    this.showArcs = _this.model.size.showArcs !== false;

    this.element = d3.select(this.element);
    this.sliderSvg = this.element.select(".vzb-bs-svg");
    this.sliderWrap = this.sliderSvg.select(".vzb-bs-slider-wrap");
    this.sliderEl = this.sliderWrap.select(".vzb-bs-slider");

    const textMargin = { v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT };
    const textMaxWidth = OPTIONS.TEXT_PARAMS.MAX_WIDTH;
    const textMaxHeight = OPTIONS.TEXT_PARAMS.MAX_HEIGHT;
    const barWidth = OPTIONS.BAR_WIDTH;
    const thumbRadius = OPTIONS.THUMB_RADIUS;
    const thumbStrokeWidth = OPTIONS.THUMB_STROKE_WIDTH;

    this.padding = {
      top: thumbStrokeWidth,
      left: textMargin.h + textMaxWidth,
      right: textMargin.h + textMaxWidth,
      bottom: barWidth + textMaxHeight
    };

    const minMaxBubbleRadius = this.getMinMaxBubbleRadius();

    this.xScale = d3.scale.linear()
      .domain([OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX])
      .range([minMaxBubbleRadius.min * 2, minMaxBubbleRadius.max * 2])
      .clamp(true);

    this.brush = d3.brushX()
      .extent([[0, 0], [minMaxBubbleRadius.max * 2, barWidth]])
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
      .enter().append("svg").attr("class", d => "handle handle--" + d.type)
      .classed("vzb-bs-slider-thumb", true);

    this.sliderThumbs.append("g")
      .attr("class", "vzb-bs-slider-thumb-badge")
      .append("path")
      .attr("d", "M" + (thumbRadius + barWidth) + " " + (thumbRadius + barWidth * 1.5) + "l" + (-thumbRadius) + " " + (thumbRadius * 1.5) + "h" + (thumbRadius * 2) + "Z");

    this.sliderEl
      .call(_this.brush);

    //For return to round thumbs
    //var thumbArc = d3.arc()
    //  .outerRadius(thumbRadius)
    //  .startAngle(0)
    //  .endAngle(2 * Math.PI)

    //For return to circles
    //.attr("d", "M0 0 l" + (thumbRadius * 2) + " " + (-thumbRadius) + "v" + (thumbRadius * 2) + "Z")

    //For return to round thumbs
    //.attr("d", thumbArc)

    if (_this.showArcs) {
      this.sliderEl.selectAll(".vzb-bs-slider-thumb-arc").data([0, 0]).enter()
        .append("path")
        .attr("class", "vzb-bs-slider-thumb-arc");
    }

    this.sliderArcsEl = this.sliderEl.selectAll(".vzb-bs-slider-thumb-arc");

    this.sliderEl.selectAll("text").data([0, 0]).enter()
      .append("text")
      .attr("class", "vzb-bs-slider-thumb-label")
      .attr("text-anchor", (d, i) => i ? "start" : "end")
      .attr("dy", (d, i) => i ? "-0.7em" : "1.4em");

    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-bs-slider-thumb-label");

    this.sliderEl.selectAll(".selection,.overlay")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")");

    //For return to circles
    // var circleLabelTransform = function(d, i) {
    //    var dX = i ? textMargin.h + _this.xScale(d) : -textMargin.h,
    //        dY = -textMargin.v;
    //    return "translate(" + (dX) + "," + (dY) + ")";
    // }

    this.on("resize", () => {
      //console.log("EVENT: resize");
      const minMaxBubbleRadius = _this.getMinMaxBubbleRadius();
      _this.xScale.range([minMaxBubbleRadius.min * 2, minMaxBubbleRadius.max * 2]);
      _this._updateSize();
      _this.sliderEl.call(_this.brush.extent([[0, 0], [minMaxBubbleRadius.max * 2, barWidth]]));
      const extent = _this.model.size.extent || [OPTIONS.EXTENT_MIN, OPTIONS.EXTENT_MAX];
      _this._moveBrush(extent);
    });

    this._updateSize();
    this._moveBrush(extent);

    this.sizeScaleMinMax = this.model.size.getScale().domain();

    if (this.sizeScaleMinMax) {
      this._setLabelsText();
    }
  },

  getMinMaxBubbleRadius() {
    return { min: profiles[this.getLayoutProfile()].minRadius, max: profiles[this.getLayoutProfile()].maxRadius };
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
    const maxBubbleRadius = this.showArcs ? this.getMinMaxBubbleRadius().max : OPTIONS.TEXT_PARAMS.TOP * 2;
    this.sliderSvg
      .attr("height", maxBubbleRadius + this.padding.top + this.padding.bottom)
      .attr("width", this.getMinMaxBubbleRadius().max * 2 + this.padding.left + this.padding.right);
    this.sliderWrap
      .attr("transform", "translate(" + this.padding.left + "," + (maxBubbleRadius + this.padding.top) + ")");
  },

  _updateArcs(s) {
    if (!this.showArcs) return;
    const _this = this;
    const valueArc = d3.arc()
      .outerRadius(d => _this.xScale(d) * 0.5)
      .innerRadius(d => _this.xScale(d) * 0.5)
      .startAngle(-Math.PI * 0.5)
      .endAngle(Math.PI * 0.5);
    this.sliderArcsEl.data(s)
      .attr("d", valueArc)
      .attr("transform", d => "translate(" + (_this.xScale(d) * 0.5) + ",0)");
  },

  _updateLabels(s) {
    const _this = this;
    this.sliderLabelsEl.data(s)
      .attr("transform", (d, i) => {
        const textMargin = { v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT };
        const dX = textMargin.h * (i ? 0.5 : -1.0) + _this.xScale(d);
        const dY = 0;
        return "translate(" + (dX) + "," + (dY) + ")";
      });
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
    this._updateArcs(s);
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

export default BubbleSize;
