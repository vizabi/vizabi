import * as utils from "base/utils";
import Class from "base/class";

import { close as iconClose } from "base/iconset";

const label = function(context) {

  return (function d3_label() {

    const _this = context;

    let _cssPrefix;
    label.setCssPrefix = function(cssPrefix) {
      _cssPrefix = cssPrefix;
      return label;
    };

    const labelDragger = d3.drag()
      .on("start", (d, i) => {
        d3.event.sourceEvent.stopPropagation();
        const KEY = _this.KEY;
      })
      .on("drag", function(d, i) {
        const KEY = _this.KEY;
        if (!_this.model.ui.chart.labels.dragging) return;
        if (!this.druging) _this.druging = d[KEY];
        const cache = _this.cached[d[KEY]];
        cache.labelFixed = true;

        const viewWidth = _this.context.width;
        const viewHeight = _this.context.height;

        cache.labelX_ += d3.event.dx / viewWidth;
        cache.labelY_ += d3.event.dy / viewHeight;

        const resolvedX = _this.xScale(cache.labelX0) + cache.labelX_ * viewWidth;
        const resolvedY = _this.yScale(cache.labelY0) + cache.labelY_ * viewHeight;

        const resolvedX0 = _this.xScale(cache.labelX0);
        const resolvedY0 = _this.yScale(cache.labelY0);

        const lineGroup = _this.entityLines.filter(f => f[KEY] == d[KEY]);

        label._repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, 0, null, lineGroup);
      })
      .on("end", (d, i) => {
        const KEY = _this.KEY;
        if (_this.druging) {
          const cache = _this.cached[d[KEY]];
          _this.druging = null;
          cache.labelOffset[0] = cache.labelX_;
          cache.labelOffset[1] = cache.labelY_;
          _this.model.marker.setLabelOffset(d, [cache.labelX_, cache.labelY_]);
        }
      });

    function label(container) {
      container
        .call(labelDragger)
        .each(function(d, index) {
          const view = d3.select(this);

  // Ola: Clicking bubble label should not zoom to countries boundary #811
  // It's too easy to accidentally zoom
  // This feature will be activated later, by making the label into a "context menu" where users can click Split, or zoom,.. hide others etc....

          view.append("rect")
            .attr("class", "vzb-label-glow")
            .attr("filter", "url(" + location.pathname + "#vzb-glow-filter)");
          view.append("rect")
            .attr("class", "vzb-label-fill vzb-tooltip-border");
  //          .on("click", function(d, i) {
  //            //default prevented is needed to distinguish click from drag
  //            if(d3.event.defaultPrevented) return;
  //
  //            var maxmin = _this.cached[d[KEY]].maxMinValues;
  //            var radius = utils.areaToRadius(_this.sScale(maxmin.valueSmax));
  //            _this._panZoom._zoomOnRectangle(_this.element,
  //              _this.xScale(maxmin.valueXmin) - radius,
  //              _this.yScale(maxmin.valueYmin) + radius,
  //              _this.xScale(maxmin.valueXmax) + radius,
  //              _this.yScale(maxmin.valueYmax) - radius,
  //              false, 500);
  //          });

          view.append("text").attr("class", _cssPrefix + "-label-content " + _cssPrefix + "-label-shadow vzb-noexport");

          view.append("text").attr("class", _cssPrefix + "-label-content");

          const cross = view.append("g").attr("class", _cssPrefix + "-label-x vzb-transparent");
          utils.setIcon(cross, iconClose);

          cross.insert("circle", "svg");

          cross.select("svg")
            .attr("class", _cssPrefix + "-label-x-icon")
            .attr("width", "0px")
            .attr("height", "0px");

          cross.on("click", () => {
            //default prevented is needed to distinguish click from drag
            if (d3.event.defaultPrevented) return;
            d3.event.stopPropagation();
            _this.model.marker.clearHighlighted();
            _this.model.marker.selectMarker(d);
          });

        })
        .on("mouseover", function(d) {
          if (utils.isTouchDevice()) return;
          _this.model.marker.highlightMarker(d);
          const KEY = _this.KEY || _this.model.entities.getDimension();
          // hovered label should be on top of other labels: if "a" is not the hovered element "d", send "a" to the back
          _this.entityLabels.sort((a, b) => a[KEY] != d[KEY] ? -1 : 1);
          d3.select(this).selectAll("." + _cssPrefix + "-label-x")
            .classed("vzb-transparent", false);
        })
        .on("mouseout", function(d) {
          if (utils.isTouchDevice()) return;
          _this.model.marker.clearHighlighted();
          d3.select(this).selectAll("." + _cssPrefix + "-label-x")
            .classed("vzb-transparent", true);
        })
        .on("click", function(d) {
          if (!utils.isTouchDevice()) return;
          const cross = d3.select(this).selectAll("." + _cssPrefix + "-label-x");
          const KEY = _this.KEY || _this.model.entities.getDimension();
          const hidden = cross.classed("vzb-transparent");
          if (hidden) {
            // hovered label should be on top of other labels: if "a" is not the hovered element "d", send "a" to the back
            _this.entityLabels.sort((a, b) => a[KEY] != d[KEY] ? -1 : 1);
            _this.showCloseCross(null, false);
          }
          cross.classed("vzb-transparent", !hidden);
          if (!_this.options.SUPPRESS_HIGHLIGHT_DURING_PLAY || !_this.model.time.playing) {
            if (hidden) {
              _this.model.marker.setHighlight(d);
            } else {
              _this.model.marker.clearHighlighted();
            }
          }
        });

      return label;
    }

    label.line = function(container) {
      container.append("line").attr("class", _cssPrefix + "-label-line");
    };


    label._repositionLabels = _repositionLabels;
    function _repositionLabels(d, i, labelContext, _X, _Y, _X0, _Y0, duration, showhide, lineGroup) {

      const cache = _this.cached[d[_this.KEY]];

      const labelGroup = d3.select(labelContext);

      //protect label and line from the broken data
      const brokenInputs = !_X && _X !== 0 || !_Y && _Y !== 0 || !_X0 && _X0 !== 0 || !_Y0 && _Y0 !== 0;
      if (brokenInputs) {
        labelGroup.classed("vzb-invisible", brokenInputs);
        lineGroup.classed("vzb-invisible", brokenInputs);
        return;
      }

      const viewWidth = _this.context.width;
      const viewHeight = _this.context.height;
      const rectBBox = cache.rectBBox;
      const width = rectBBox.width;
      const height = rectBBox.height;

      //apply limits so that the label doesn't stick out of the visible field
      if (_X - width <= 0) { //check left
        _X = width;
        cache.labelX_ = (_X - _this.xScale(cache.labelX0)) / viewWidth;
      } else if (_X + 5 > viewWidth) { //check right
        _X = viewWidth - 5;
        cache.labelX_ = (_X - _this.xScale(cache.labelX0)) / viewWidth;
      }
      if (_Y - height * 0.75 <= 0) { // check top
        _Y = height * 0.75;
        cache.labelY_ = (_Y - _this.yScale(cache.labelY0)) / viewHeight;
      } else if (_Y + height * 0.35 > viewHeight) { //check bottom
        _Y = viewHeight - height * 0.35;
        cache.labelY_ = (_Y - _this.yScale(cache.labelY0)) / viewHeight;
      }

      if (duration == null) duration = _this.context.duration;
      if (cache._new) {
        duration = 0;
        delete cache._new;
      }
      if (duration) {
        if (showhide && !d.hidden) {
            //if need to show label

          labelGroup.classed("vzb-invisible", d.hidden);
          labelGroup
            .attr("transform", "translate(" + _X + "," + _Y + ")")
            .style("opacity", 0)
            .transition().duration(duration).ease(d3.easeExp)
            .style("opacity", 1)
                //i would like to set opactiy to null in the end of transition.
                //but then fade in animation is not working for some reason
            .on("interrupt", () => {
              labelGroup
                .style("opacity", 1);
            });
          lineGroup.classed("vzb-invisible", d.hidden);
          lineGroup
            .attr("transform", "translate(" + _X + "," + _Y + ")")
            .style("opacity", 0)
            .transition().duration(duration).ease(d3.easeExp)
            .style("opacity", 1)
                //i would like to set opactiy to null in the end of transition.
                //but then fade in animation is not working for some reason
            .on("interrupt", () => {
              lineGroup
                .style("opacity", 1);
            });

        } else if (showhide && d.hidden) {
            //if need to hide label

          labelGroup
            .style("opacity", 1)
            .transition().duration(duration).ease(d3.easeExp)
            .style("opacity", 0)
            .on("end", () => {
              labelGroup
                .style("opacity", 1) //i would like to set it to null. but then fade in animation is not working for some reason
                .classed("vzb-invisible", d.hidden);
            });
          lineGroup
            .style("opacity", 1)
            .transition().duration(duration).ease(d3.easeExp)
            .style("opacity", 0)
            .on("end", () => {
              lineGroup
                .style("opacity", 1) //i would like to set it to null. but then fade in animation is not working for some reason
                .classed("vzb-invisible", d.hidden);
            });

        } else {
            // just update the position

          labelGroup
            .transition().duration(duration).ease(d3.easeLinear)
            .attr("transform", "translate(" + _X + "," + _Y + ")");
          lineGroup
            .transition().duration(duration).ease(d3.easeLinear)
            .attr("transform", "translate(" + _X + "," + _Y + ")");
        }

      } else {
        labelGroup
          .interrupt()
          .attr("transform", "translate(" + _X + "," + _Y + ")")
          .transition();
        lineGroup
          .interrupt()
          .attr("transform", "translate(" + _X + "," + _Y + ")")
          .transition();
        if (showhide) labelGroup.classed("vzb-invisible", d.hidden);
        if (showhide) lineGroup.classed("vzb-invisible", d.hidden);
      }

      const diffX1 = _X0 - _X;
      const diffY1 = _Y0 - _Y;
      const textBBox = labelGroup.select("text").node().getBBox();
      let diffX2 = -textBBox.width * 0.5;
      let diffY2 = -height * 0.2;
      const labels = _this.model.ui.chart.labels;

      const bBox = labels.removeLabelBox ? textBBox : rectBBox;

      const FAR_COEFF = _this.activeProfile.labelLeashCoeff || 0;

      const lineHidden = circleRectIntersects({ x: diffX1, y: diffY1, r: cache.scaledS0 },
        { x: diffX2, y: diffY2, width: (bBox.height * 2 * FAR_COEFF + bBox.width), height: (bBox.height * (2 * FAR_COEFF + 1)) });
      lineGroup.select("line").classed("vzb-invisible", lineHidden);
      if (lineHidden) return;

      if (labels.removeLabelBox) {
        const angle = Math.atan2(diffX1 - diffX2, diffY1 - diffY2) * 180 / Math.PI;
        const deltaDiffX2 = (angle >= 0 && angle <= 180) ? (bBox.width * 0.5) : (-bBox.width * 0.5);
        const deltaDiffY2 = (Math.abs(angle) <= 90) ? (bBox.height * 0.55) : (-bBox.height * 0.45);
        diffX2 += Math.abs(diffX1 - diffX2) > textBBox.width * 0.5 ? deltaDiffX2 : 0;
        diffY2 += Math.abs(diffY1 - diffY2) > textBBox.height * 0.5 ? deltaDiffY2 : (textBBox.height * 0.05);
      }

      const longerSideCoeff = Math.abs(diffX1) > Math.abs(diffY1) ? Math.abs(diffX1) : Math.abs(diffY1);
      lineGroup.select("line").style("stroke-dasharray", "0 " + (cache.scaledS0) + " " + ~~(longerSideCoeff) * 2);

      lineGroup.selectAll("line")
        .attr("x1", diffX1)
        .attr("y1", diffY1)
        .attr("x2", diffX2)
        .attr("y2", diffY2);

    }

    /*
    * Adapted from
    * http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
    *
    * circle {
    *  x: center X
    *  y: center Y
    *  r: radius
    * }
    *
    * rect {
    *  x: center X
    *  y: center Y
    *  width: width
    *  height: height
    * }
    */
    function circleRectIntersects(circle, rect) {
      const circleDistanceX = Math.abs(circle.x - rect.x);
      const circleDistanceY = Math.abs(circle.y - rect.y);
      const halfRectWidth = rect.width * 0.5;
      const halfRectHeight = rect.height * 0.5;

      if (circleDistanceX > (halfRectWidth + circle.r)) { return false; }
      if (circleDistanceY > (halfRectHeight + circle.r)) { return false; }

      if (circleDistanceX <= halfRectWidth) { return true; }
      if (circleDistanceY <= halfRectHeight) { return true; }

      const cornerDistance_sq = Math.pow(circleDistanceX - halfRectWidth, 2) +
                          Math.pow(circleDistanceY - halfRectHeight, 2);

      return (cornerDistance_sq <= Math.pow(circle.r, 2));
    }

    return label;
  })();
};

const OPTIONS = {
  LABELS_CONTAINER_CLASS: "",
  LINES_CONTAINER_CLASS: "",
  LINES_CONTAINER_SELECTOR: "",
  CSS_PREFIX: "",
  SUPPRESS_HIGHLIGHT_DURING_PLAY: true
};

const Labels = Class.extend({

  init(context, conditions) {
    const _this = this;
    this.context = context;

    this.options = utils.extend({}, OPTIONS);
    this.label = label(this);
    this._xScale = null;
    this._yScale = null;
    this._closeCrossHeight = 0;
    this.labelSizeTextScale = null;
  },

  ready() {
    this.updateIndicators();
    this.updateLabelSizeLimits();
    //this.updateLabelsOnlyTextSize();
  },

  readyOnce() {
    const _this = this;

    this.model = this.context.model;

    this.model.on("change:marker.select", () => {
      if (!_this.context._readyOnce) return;
        //console.log("EVENT change:entities:select");
      _this.selectDataPoints();
    });

    if (this.model.marker.size_label)
      this.model.on("change:marker.size_label.extent", (evt, path) => {
        //console.log("EVENT change:marker:size:max");
        if (!_this.context._readyOnce) return;
        _this.updateLabelSizeLimits();
        if (_this.model.time.splash) return;
        _this.updateLabelsOnlyTextSize();
      });

    if (this.model.ui.chart.labels.hasOwnProperty("removeLabelBox"))
      this.model.on("change:ui.chart.labels.removeLabelBox", (evt, path) => {
        //console.log("EVENT change:marker:size:max");
        if (!_this.context._readyOnce) return;
        _this.updateLabelsOnlyTextSize();
      });

    this.KEY = this.context.model.entities.getDimension();

    this.cached = {};

    this.label.setCssPrefix(this.options.CSS_PREFIX);

    this.rootEl = this.context.root.element instanceof Array ? this.context.root.element : d3.select(this.context.root.element);
    this.labelsContainer = this.rootEl.select("." + this.options.LABELS_CONTAINER_CLASS);
    this.linesContainer = this.rootEl.select("." + this.options.LINES_CONTAINER_CLASS);
    this.updateIndicators();
    this.updateSize();
    this.selectDataPoints();
  },

  config(newOptions) {
    utils.extend(this.options, newOptions);
  },

  updateLabelSizeLimits() {
    const _this = this;
    if (!this.model.marker.size_label) return;
    const extent = this.model.marker.size_label.extent || [0, 1];

    const minLabelTextSize = this.activeProfile.minLabelTextSize;
    const maxLabelTextSize = this.activeProfile.maxLabelTextSize;
    const minMaxDelta = maxLabelTextSize - minLabelTextSize;

    this.minLabelTextSize = Math.max(minLabelTextSize + minMaxDelta * extent[0], minLabelTextSize);
    this.maxLabelTextSize = Math.max(minLabelTextSize + minMaxDelta * extent[1], minLabelTextSize);

    if (this.model.marker.size_label.use == "constant") {
      // if(!this.model.marker.size_label.which) {
      //   this.maxLabelTextSize = this.activeProfile.defaultLabelTextSize;
      //   this.model.marker.size_label.set({'domainMax': (this.maxLabelTextSize - minLabelTextSize) / minMaxDelta, 'which': '_default'});
      //   return;
      // }
      this.minLabelTextSize = this.maxLabelTextSize;
    }

    if (this.model.marker.size_label.scaleType !== "ordinal" || this.model.marker.size_label.use == "constant") {
      this.labelSizeTextScale.range([_this.minLabelTextSize, _this.maxLabelTextSize]);
    } else {
      this.labelSizeTextScale.rangePoints([_this.minLabelTextSize, _this.maxLabelTextSize], 0).range();
    }

  },

  updateIndicators() {
    const _this = this;

    //scales
    if (this.model.marker.size_label) {
      this.labelSizeTextScale = this.model.marker.size_label.getScale();
    }
  },

  setScales(xScale, yScale) {
    this._xScale = xScale;
    this._yScale = yScale;
  },

  setCloseCrossHeight(closeCrossHeight) {
    if (this._closeCrossHeight != closeCrossHeight) {
      this._closeCrossHeight = closeCrossHeight;
      this.updateLabelCloseGroupSize(this.entityLabels.selectAll("." + this.options.CSS_PREFIX + "-label-x"), this._closeCrossHeight);
    }
  },

  xScale(x) {
    return this._xScale ? this._xScale(x) : (x * this.context.width);
  },

  yScale(y) {
    return this._yScale ? this._yScale(y) : (y * this.context.height);
  },

  selectDataPoints() {
    const _this = this;
    const KEY = this.KEY;
    const _cssPrefix = this.options.CSS_PREFIX;

    this.entityLabels = this.labelsContainer.selectAll("." + _cssPrefix + "-entity")
      .data(_this.model.marker.select, d => (d[KEY]));
    this.entityLines = this.linesContainer.selectAll("g.entity-line." + _cssPrefix + "-entity")
      .data(_this.model.marker.select, d => (d[KEY]));

    this.entityLabels.exit()
      .each(d => {
        if (_this.cached[d[KEY]] != null) {
          _this.cached[d[KEY]] = void 0;
        }
      })
      .remove();
    this.entityLines.exit()
      .remove();

    this.entityLines = this.entityLines
      .enter().insert("g", function(d) {
        return this.querySelector("." + _this.options.LINES_CONTAINER_SELECTOR_PREFIX + d[KEY]);
      })
      .attr("class", (d, index) => _cssPrefix + "-entity entity-line line-" + d[KEY])
      .each(function(d, index) {
        _this.label.line(d3.select(this));
      })
      .merge(this.entityLines);

    this.entityLabels = this.entityLabels
      .enter().append("g")
      .attr("class", (d, index) => _cssPrefix + "-entity label-" + d[KEY])
      .each(function(d, index) {
        _this.cached[d[KEY]] = { _new: true };
        _this.label(d3.select(this));
      })
      .merge(this.entityLabels);
  },

  showCloseCross(d, show) {
    const KEY = this.KEY;
    //show the little cross on the selected label
    this.entityLabels
      .filter(f => d ? f[KEY] == d[KEY] : true)
      .select("." + this.options.CSS_PREFIX + "-label-x")
      .classed("vzb-transparent", !show);
  },

  highlight(d, highlight) {
    const KEY = this.KEY;
    let labels = this.entityLabels;
    if (d) {
      labels = labels.filter(f => d ? f[KEY] == d[KEY] : true);
    }
    labels.classed("vzb-highlighted", highlight);
  },

  updateLabel(d, index, cache, valueX, valueY, valueS, valueC, valueL, valueLST, duration, showhide) {
    const _this = this;
    const KEY = this.KEY;
    if (d[KEY] == _this.druging)
      return;

    const _cssPrefix = this.options.CSS_PREFIX;

    // only for selected entities
    if (_this.model.marker.isSelected(d) && _this.entityLabels != null) {
      if (_this.cached[d[KEY]] == null) this.selectDataPoints();

      const cached = _this.cached[d[KEY]];
      if (cache) utils.extend(cached, cache);


      if (cached.scaledS0 == null || cached.labelX0 == null || cached.labelY0 == null) { //initialize label once
        if (valueS || valueS === 0) cached.scaledS0 = utils.areaToRadius(this.context.sScale(valueS));
        cached.labelX0 = valueX;
        cached.labelY0 = valueY;
        cached.valueLST = valueLST;
        cached.scaledC0 = valueC != null ? this.context.cScale(valueC) : this.context.COLOR_WHITEISH;
      }

      if (cached.labelX_ == null || cached.labelY_ == null)
      {
        const select = utils.find(_this.model.marker.select, f => f[KEY] == d[KEY]);
        cached.labelOffset = select.labelOffset || [0, 0];
      }

      const brokenInputs = !cached.labelX0 && cached.labelX0 !== 0 || !cached.labelY0 && cached.labelY0 !== 0 || !cached.scaledS0 && cached.scaledS0 !== 0;

      const lineGroup = _this.entityLines.filter(f => f[KEY] == d[KEY]);
      // reposition label
      _this.entityLabels.filter(f => f[KEY] == d[KEY])
        .each(function(groupData) {

          const labelGroup = d3.select(this);

          if (brokenInputs) {
            labelGroup.classed("vzb-invisible", brokenInputs);
            lineGroup.classed("vzb-invisible", brokenInputs);
            return;
          }

          const text = labelGroup.selectAll("." + _cssPrefix + "-label-content")
            .text(valueL);

          _this._updateLabelSize(d, index, labelGroup, valueLST, text);

          _this.positionLabel(d, index, this, duration, showhide, lineGroup);
        });
    }
  },

  _updateLabelSize(d, index, labelGroup, valueLST, text) {
    const _this = this;
    const KEY = this.KEY;
    const cached = _this.cached[d[KEY]];


    const _cssPrefix = this.options.CSS_PREFIX;

    const labels = _this.model.ui.chart.labels || {};
    labelGroup.classed("vzb-label-boxremoved", labels.removeLabelBox);

    const _text = text || labelGroup.selectAll("." + _cssPrefix + "-label-content");

    if (_this.labelSizeTextScale) {
      if (valueLST != null) {
        const range = _this.labelSizeTextScale.range();
        const fontSize = range[0] + Math.sqrt((_this.labelSizeTextScale(valueLST) - range[0]) * (range[1] - range[0]));
        _text.attr("font-size", fontSize + "px");
      } else {
        _text.attr("font-size", "");
      }
    }

    const contentBBox = _text.node().getBBox();

    const rect = labelGroup.selectAll("rect");

    if (!cached.textWidth || cached.textWidth != contentBBox.width) {
      cached.textWidth = contentBBox.width;

      const labelCloseHeight = _this._closeCrossHeight || contentBBox.height;//_this.activeProfile.infoElHeight * 1.2;//contentBBox.height;

      const isRTL = _this.model.locale.isRTL();
      const labelCloseGroup = labelGroup.select("." + _cssPrefix + "-label-x")
        .attr("transform", "translate(" + (isRTL ? -contentBBox.width - 4 : 4) + "," + (-contentBBox.height * 0.85) + ")");

      this.updateLabelCloseGroupSize(labelCloseGroup, labelCloseHeight);

      rect.attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * 0.85)
        .attr("rx", contentBBox.height * 0.2)
        .attr("ry", contentBBox.height * 0.2);

      //cache label bound rect for reposition
      cached.rectBBox = rect.node().getBBox();
      //cached.moveX = 5;
      //cached.moveY = contentBBox.height * .3;
    }

    const glowRect = labelGroup.select(".vzb-label-glow");
    if (glowRect.attr("stroke") !== cached.scaledC0) {
      glowRect.attr("stroke", cached.scaledC0);
    }
  },

  updateLabelCloseGroupSize(labelCloseGroup, labelCloseHeight) {
    labelCloseGroup.select("circle")
      .attr("cx", /*contentBBox.height * .0 + */ 0)
      .attr("cy", 0)
      .attr("r", labelCloseHeight * 0.5);

    labelCloseGroup.select("svg")
      .attr("x", -labelCloseHeight * 0.5)
      .attr("y", labelCloseHeight * -0.5)
      .attr("width", labelCloseHeight)
      .attr("height", labelCloseHeight);

  },

  updateLabelsOnlyTextSize() {
    const _this = this;
    const KEY = this.KEY;

    this.entityLabels.each(function(d, index) {
      const cached = _this.cached[d[KEY]];
      _this._updateLabelSize(d, index, d3.select(this), _this.context.frame.size_label[d[KEY]]);
      const lineGroup = _this.entityLines.filter(f => f[KEY] == d[KEY]);
      _this.positionLabel(d, index, this, 0, null, lineGroup);
    });
  },

  updateLabelOnlyPosition(d, index, cache) {
    const _this = this;
    const KEY = this.KEY;
    const cached = this.cached[d[KEY]];
    if (cache) utils.extend(cached, cache);

    const lineGroup = _this.entityLines.filter(f => f[KEY] == d[KEY]);

    this.entityLabels.filter(f => f[KEY] == d[KEY])
      .each(function(groupData) {
        _this.positionLabel(d, index, this, 0, null, lineGroup);
      });
  },

  updateLabelOnlyColor(d, index, cache) {
    const _this = this;
    const KEY = this.KEY;
    const cached = this.cached[d[KEY]];
    if (cache) utils.extend(cached, cache);

    const labelGroup = _this.entityLabels.filter(f => f[KEY] == d[KEY]);

    _this._updateLabelSize(d, index, labelGroup, null);

  },

  positionLabel(d, index, context, duration, showhide, lineGroup) {
    const KEY = this.KEY;
    const cached = this.cached[d[KEY]];

    const viewWidth = this.context.width;
    const viewHeight = this.context.height;

    const resolvedX0 = this.xScale(cached.labelX0);
    const resolvedY0 = this.yScale(cached.labelY0);

    if (!cached.labelOffset) cached.labelOffset = [0, 0];
    cached.labelX_ = cached.labelOffset[0] || (-cached.scaledS0 * 0.75 - 5) / viewWidth;
    cached.labelY_ = cached.labelOffset[1] || (-cached.scaledS0 * 0.75 - 11) / viewHeight;

    //check default label position and switch to mirror position if position
    //does not bind to visible field

    let resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
    if (cached.labelOffset[0] == 0) {
      if (resolvedX - cached.rectBBox.width <= 0) { //check left
        cached.labelX_ = (cached.scaledS0 * 0.75 + cached.rectBBox.width) / viewWidth;
        resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
      } else if (resolvedX + 15 > viewWidth) { //check right
        cached.labelX_ = (viewWidth - 15 - resolvedX0) / viewWidth;
        resolvedX = resolvedX0 + cached.labelX_ * viewWidth;
      }
    }
    let resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
    if (cached.labelOffset[1] == 0) {
      if (resolvedY - cached.rectBBox.height <= 0) { // check top
        cached.labelY_ = (cached.scaledS0 * 0.75 + cached.rectBBox.height) / viewHeight;
        resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
      } else if (resolvedY + 10 > viewHeight) { //check bottom
        cached.labelY_ = (viewHeight - 10 - resolvedY0) / viewHeight;
        resolvedY = resolvedY0 + cached.labelY_ * viewHeight;
      }
    }
    this.label._repositionLabels(d, index, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration, showhide, lineGroup);
  },

  updateSize() {
    const profiles = {
      small: {
        minLabelTextSize: 7,
        maxLabelTextSize: 21,
        defaultLabelTextSize: 12,
        labelLeashCoeff: 0.4
      },
      medium: {
        minLabelTextSize: 7,
        maxLabelTextSize: 30,
        defaultLabelTextSize: 15,
        labelLeashCoeff: 0.3
      },
      large: {
        minLabelTextSize: 6,
        maxLabelTextSize: 48,
        defaultLabelTextSize: 20,
        labelLeashCoeff: 0.2
      }
    };

    const presentationProfiles = {
      medium: {
        minLabelTextSize: 15,
        maxLabelTextSize: 35,
        defaultLabelTextSize: 15,
        labelLeashCoeff: 0.3
      },
      large: {
        minLabelTextSize: 20,
        maxLabelTextSize: 55,
        defaultLabelTextSize: 20,
        labelLeashCoeff: 0.2
      }
    };

    this.activeProfile = this.context.getActiveProfile(profiles, presentationProfiles);
    this.updateLabelSizeLimits();
  }

});

export default Labels;
