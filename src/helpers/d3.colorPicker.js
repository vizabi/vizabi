import { isTouchDevice } from "base/utils";

const css = {
  INVISIBLE: "vzb-invisible",
  COLOR_POINTER: "vzb-colorpicker-pointer",
  COLOR_BUTTON: "vzb-colorpicker-cell",
  COLOR_DEFAULT: "vzb-colorpicker-default",
  COLOR_SAMPLE: "vzb-colorpicker-sample",
  COLOR_PICKER: "vzb-colorpicker-svg",
  COLOR_CIRCLE: "vzb-colorpicker-circle",
  COLOR_CIRCLES: "vzb-colorpicker-circles",
  COLOR_SEGMENT: "vzb-colorpicker-segment",
  COLOR_BACKGR: "vzb-colorpicker-background"
};

export default class ColorPicker {
  constructor(container) {
    this._container = container;
    this._wrapper = this._container.select("." + css.COLOR_PICKER);

    this._init();
  }

  _init() {
    this._initVariables();
    this._initCircles();
    this._style();
    this.resize(this._svg);
  }

  _initVariables() {
    // radius of the central hole in color wheel: px
    this._maxWidth = 280;
    this._maxHeight = 323;

    this._colorOld = "#000";
    this._colorDef = "#000";
    this._colorWhite = "#f8f8f8";

    // margins in % of container's width and height
    this._margin = {
      top: 0.1,
      bottom: 0.1,
      left: 0.1,
      right: 0.1
    };

    this._initSvg();

    const {
      width: svgWidth,
      height: svgHeight
    } = getComputedStyle(this._svg.node());
    this._width = this.constructor.px2num(svgWidth);
    this._height = this.constructor.px2num(svgHeight);
    this._maxRadius = this._width / 2 * (1 - this._margin.left - this._margin.right);

    // tuning defaults
    this._nCellsH = 15;
    // number of cells by hues (angular)
    this._minH = 0;
    // which hue do we start from: 0 to 1 instead of 0 to 365
    this._nCellsL = 4;
    // number of cells by lightness (radial)
    this._minL = 0.5;
    // which lightness to start from: 0 to 1. Recommended .3...0.5
    this._satConstant = 0.7;
    // constant saturation for color wheel: 0 to 1. Recommended .7...0.8
    this._outerL_display = 0.4;
    // exceptional saturation of the outer circle. the one displayed 0 to 1
    this._outerL_meaning = 0.3;
    // exceptional saturation of the outer circle. the one actually meant 0 to 1
    this._firstAngleSat = 0;
    // exceptional saturation at first angular segment. Set 0 to have shades of grey
    this._minRadius = 15;
    this._arc = d3.arc();


    this._pie = d3.pie().sort(null).value(d => 1);
    this._colorPointer = null;
    this._showColorPicker = false;
    this._sampleRect = null;
    this._sampleText = null;
    this._callback = value => console.info(`Color picker callback example. Setting color to ${value}`);
    this._colorData = this._generateColorData();
  }

  _generateColorData() {
    const {
      _minL,
      _minH,
      _nCellsL,
      _nCellsH,
      _firstAngleSat,
      _satConstant,
      _outerL_display,
      _outerL_meaning,
    } = this;

    const result = [];
    // loop across circles
    for (let l = 0; l < _nCellsL; l++) {
      const lightness = _minL + (1 - _minL) / _nCellsL * l;
      // new circle of cells
      result.push([]);
      // loop across angles
      for (let h = 0; h <= _nCellsH; h++) {
        const hue = _minH + (1 - _minH) / _nCellsH * h;
        // new cell
        result[l].push({
          display: this.constructor.hsl2rgb(
            hue,
            h === 0 ? _firstAngleSat : _satConstant,
            l === 0 ? _outerL_display : lightness
          ),

          meaning: this.constructor.hsl2rgb(
            hue,
            h === 0 ? _firstAngleSat : _satConstant,
            l === 0 ? _outerL_meaning : lightness
          )
        });
      }
    }

    return result;
  }

  _initSvg() {
    this._wrapper = this._container.append("div")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0")
      .style("width", "100%")
      .style("max-width", this._maxWidth + "px")
      .style("height", "100%")
      .style("max-height", this._maxHeight + "px")
      .style("z-index", 9999)
      .attr("class", css.COLOR_PICKER + " vzb-dialog-shadow")
      .classed(css.INVISIBLE, !this._showColorPicker)
      .on("mouseout", () => this._cellHover(this._colorOld));

    this._svg = this._wrapper.append("svg")
      .style("width", "100%")
      .style("height", "100%");
  }

  _initCircles() {
    const {
      _svg,
      _maxHeight,
      _width,
      _height,
      _margin,
      _colorData,
      _nCellsL,
      _minRadius,
      _maxRadius,
      _colorWhite,
    } = this;

    _svg.append("rect")
      .attr("width", _width)
      .attr("height", _maxHeight)
      .attr("class", css.COLOR_BACKGR)
      .on("mouseover", () => this._cellHover(this._colorOld))
      .on("click", () => {
        d3.event.stopPropagation();
        this._changeColor(this._colorOld);
        this.show(false);
      });

    const tx = _maxRadius + _width * _margin.left;
    const ty = _maxRadius + _height * _margin.top;
    const circles = _svg.append("g")
      .attr("class", css.COLOR_CIRCLES)
      .attr("transform", `translate(${tx}, ${ty})`);

    _svg.append("rect")
      .attr("class", css.COLOR_SAMPLE)
      .attr("width", _width / 2)
      .attr("height", _height * _margin.top / 2);

    this._sampleRect = _svg.append("rect")
      .attr("class", css.COLOR_SAMPLE)
      .attr("width", _width / 2)
      .attr("x", _width / 2)
      .attr("height", _height * _margin.top / 2);

    _svg.append("text")
      .attr("x", _width * _margin.left)
      .attr("y", _height * _margin.top / 2)
      .attr("dy", "1.3em")
      .attr("class", css.COLOR_SAMPLE)
      .style("text-anchor", "start");

    this._sampleText = _svg.append("text")
      .attr("x", _width * (1 - _margin.right))
      .attr("y", _height * _margin.top / 2)
      .attr("dy", "1.3em")
      .attr("class", css.COLOR_SAMPLE)
      .style("text-anchor", "end");

    _svg.append("text")
      .attr("x", _width * 0.1)
      .attr("y", _height * (1 - _margin.bottom))
      .attr("dy", "1.2em")
      .attr("class", "vzb-default-label")
      .style("text-anchor", "start")
      .text("default");

    _svg.append("circle")
      .attr("class", css.COLOR_DEFAULT + " " + css.COLOR_BUTTON)
      .attr("r", _width * _margin.left / 2)
      .attr("cx", _width * _margin.left * 1.5)
      .attr("cy", _height * (1 - _margin.bottom * 1.5))
      .on("mouseover", function() {
        d3.select(this).style("stroke", "#444");
        self._cellHover(self._colorDef);
      })
      .on("mouseout", function() {
        d3.select(this).style("stroke", "none");
      });

    const self = this;
    circles.selectAll("." + css.COLOR_CIRCLE)
      .data(_colorData).enter().append("g")
      .attr("class", css.COLOR_CIRCLE)
      .each(function(circleData, index) {
        self._arc
          .outerRadius(_minRadius + (_maxRadius - _minRadius) / _nCellsL * (_nCellsL - index))
          .innerRadius(_minRadius + (_maxRadius - _minRadius) / _nCellsL * (_nCellsL - index - 1));

        const segment = d3.select(this).selectAll("." + css.COLOR_SEGMENT)
          .data(self._pie(circleData)).enter().append("g")
          .attr("class", css.COLOR_SEGMENT);

        segment.append("path")
          .attr("class", css.COLOR_BUTTON)
          .attr("d", self._arc)
          .style("fill", d => d.data.display)
          .style("stroke", d => d.data.display)
          .on("mouseover", function(d) {
            self._cellHover(d.data.meaning, this);
          })
          .on("mouseout", () => self._cellUnhover());
      });

    circles.append("circle")
      .attr("r", _minRadius)
      .attr("fill", _colorWhite)
      .attr("class", css.COLOR_BUTTON)
      .on("mouseover", function() {
        d3.select(this).style("stroke", "#555");
        self._cellHover(_colorWhite);
      })
      .on("mouseout", function() {
        d3.select(this).style("stroke", "none");
      });

    this._colorPointer = circles.append("path")
      .attr("class", css.COLOR_POINTER + " " + css.INVISIBLE);

    _svg.selectAll("." + css.COLOR_BUTTON)
      .on("click", d => {
        d3.event.stopPropagation();
        this._changeColor(d ? d.data.meaning : this._colorDef, true);
        this.show(false);
      });
  }

  _style() {
    const {
      _svg,
      _colorWhite
    } = this;

    _svg.select("." + css.COLOR_BACKGR)
      .style("fill", "white");

    _svg.select("." + css.COLOR_POINTER)
      .style("stroke-width", 2)
      .style("stroke", _colorWhite)
      .style("pointer-events", "none")
      .style("fill", "none");

    _svg.selectAll("." + css.COLOR_BUTTON)
      .style("cursor", "pointer");

    _svg.selectAll("text")
      .style("pointer-events", "none")
      .style("fill", "#D9D9D9")
      .style("font-size", "0.7em")
      .style("text-transform", "uppercase");

    _svg.selectAll("circle." + css.COLOR_BUTTON)
      .style("stroke-width", 2);

    _svg.selectAll("rect." + css.COLOR_SAMPLE)
      .style("pointer-events", "none");
  }

  _cellHover(value, view) {
    // show color pointer if the view is set (a cell of colorwheel)
    if (view != null)
      this._colorPointer
        .classed(css.INVISIBLE, false)
        .attr("d", d3.select(view).attr("d"));

    this._sampleRect.style("fill", value);
    this._sampleText.text(value);

    const isTouch = isTouchDevice();

    this._changeColor(value, isTouch);
    isTouch && this.show(false);
  }

  _changeColor(color, isClick = false) {
    this._callback(color, isClick);
  }

  _cellUnhover() {
    this._colorPointer.classed(css.INVISIBLE, true);
  }

  resize(arg) {
    if (!arguments.length)
      return;

    if (typeof arg !== "undefined") {
      const { _margin } = this;
      const svg = arg;

      const {
        width: svgWidth,
        height: svgHeight,
      } = getComputedStyle(svg.node());
      const width = this.constructor.px2num(svgWidth);
      const height = this.constructor.px2num(svgHeight);

      const maxRadius = width / 2 * (1 - _margin.left - _margin.right);
      const selectedColor = svg.select("." + css.COLOR_DEFAULT);
      const defaultLabel = svg.select(".vzb-default-label");
      const circles = svg.select("." + css.COLOR_CIRCLES);

      const hPos = maxRadius + height * _margin.top;
      const hPosCenter = (1 + _margin.top * 0.5) * height * 0.5;

      const tx = maxRadius + width * _margin.left;
      const ty = hPos > hPosCenter ? hPosCenter : hPos;
      circles.attr("transform", `translate(${tx}, ${ty})`);

      selectedColor.attr("cx", width * _margin.left * 1.5)
        .attr("cy", height * (1 - _margin.bottom * 1.5));

      defaultLabel.attr("x", width * 0.1)
        .attr("y", height * (1 - _margin.bottom));
    }

    return this.fitToScreen();
  }

  fitToScreen(arg) {
    const screen = this._container.node().getBoundingClientRect();
    let xPos, yPos;

    const {
      width: wrapperWidth,
      height: wrapperHeight,
      right: wrapperRight,
      top: wrapperTop
    } = getComputedStyle(this._wrapper.node());
    const width = this.constructor.px2num(wrapperWidth);
    const height = this.constructor.px2num(wrapperHeight);

    if (!arg) {
      xPos = screen.width - this.constructor.px2num(wrapperRight) - width;
      yPos = this.constructor.px2num(wrapperTop);
    } else {
      xPos = arg[0] - screen.left;
      yPos = arg[1] - screen.top;
    }

    const styles = { left: "" };
    if (screen.width * 0.8 <= width) {
      styles.right = (screen.width - width) * 0.5 + "px";
    } else if (xPos + width > screen.width) {
      styles.right = Math.min(screen.width * 0.1, 20) + "px";
    } else {
      styles.right = screen.width - xPos - width + "px";
    }

    if (styles.right) {
      this._wrapper.style("right", styles.right);
    }

    if (screen.height * 0.8 <= height) {
      styles.top = (screen.height - height) * 0.5 + "px";
    } else if (yPos + height * 1.2 > screen.height) {
      styles.top = screen.height * 0.9 - height + "px";
    } else {
      styles.top = yPos + "px";
    }

    if (styles.top) {
      this._wrapper.style("top", styles.top);
    }

    this._wrapper.style("left", styles.left);

    return this;
  }

  show(arg) {
    if (!arguments.length) {
      return this._showColorPicker;
    }

    if (this._svg == null) {
      console.warn("Color picker is missing SVG element. Was init sequence performed?");
    }

    this._showColorPicker = arg == "toggle" ? !this._showColorPicker : arg;

    if (!this._showColorPicker) {
      this._callback = () => void 0;
    }

    this._wrapper.classed(css.INVISIBLE, !this._showColorPicker);
  }

  _getOrSet(property, value) {
    property = "_" + property;

    if (arguments.length > 1) {
      this[property] = value;
      return this;
    }

    return this[property];
  }

  nCellsH() {
    return this._getOrSet("nCellsH", ...arguments);
  }

  minH() {
    return this._getOrSet("minH", ...arguments);
  }

  nCellsL() {
    return this._getOrSet("nCellsL", ...arguments);
  }

  minL() {
    return this._getOrSet("minL", ...arguments);
  }

  outerL_display() {
    return this._getOrSet("outerL_display", ...arguments);
  }

  outerL_meaning() {
    return this._getOrSet("outerL_meaning", ...arguments);
  }

  satConstant() {
    return this._getOrSet("satConstant", ...arguments);
  }

  firstAngleSat() {
    return this._getOrSet("firstAngleSat", ...arguments);
  }

  minRadius() {
    return this._getOrSet("minRadius", ...arguments);
  }

  margin() {
    return this._getOrSet("margin", ...arguments);
  }

  callback() {
    return this._getOrSet("callback", ...arguments);
  }

  colorDef(arg) {
    if (!arguments.length)
      return this._colorDef;

    if (typeof arg !== "undefined") {
      this._colorDef = arg;
    }

    if (this._svg == null) {
      console.warn("Color picker is missing SVG element. Was init sequence performed?");
    }

    this._svg.select("." + css.COLOR_DEFAULT).style("fill", this._colorDef);

    return this;
  }

  translate(translator) {
    if (typeof translator === "function") {
      this._svg.select(".vzb-default-label")
        .text(translator("colorpicker/default"));
    }

    return this;
  }

  colorOld(arg) {
    if (!arguments.length) {
      return this._colorOld;
    }

    this._colorOld = arg;

    if (this._svg == null) {
      console.warn("Color picker is missing SVG element. Was init sequence performed?");
    }

    this._svg.select("rect." + css.COLOR_SAMPLE).style("fill", this._colorOld);
    this._svg.select("text." + css.COLOR_SAMPLE).text(this._colorOld);

    return this;
  }

  static hsl2rgb(h, s, l) {
    let r, g, b;
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hue2rgb(p, q, h + 1 / 3);
      g = this.hue2rgb(p, q, h);
      b = this.hue2rgb(p, q, h - 1 / 3);
    }

    return "#" +
      Math.round(r * 255).toString(16) +
      Math.round(g * 255).toString(16) +
      Math.round(b * 255).toString(16);
  }

  static hue2rgb(p, q, t) {
    if (t < 0)
      t += 1;
    if (t > 1)
      t -= 1;
    if (t < 1 / 6)
      return p + (q - p) * 6 * t;
    if (t < 1 / 2)
      return q;
    if (t < 2 / 3)
      return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  static px2num(px) {
    return parseFloat(px) || 0;
  }

}
