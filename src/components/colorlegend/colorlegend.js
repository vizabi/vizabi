import * as utils from "base/utils";
import Component from "base/component";
import colorPicker from "helpers/d3.colorPicker";
import axisSmart from "helpers/d3.axisWithLabelPicker";

/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

const ColorLegend = Component.extend({

  init(config, context) {
    const _this = this;
    this.template = '<div class="vzb-cl-outer"></div>';
    this.name = "colorlegend";

    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }];

    this.model_binds = {
      "change:marker.color.scaleType": function(evt, path) {
        if (!_this._readyOnce || _this.colorModel.isDiscrete()) return;
        _this.updateView();
      },
      "change:marker.color.palette": function(evt, path) {
        if (!_this._readyOnce || (_this.colorModel.isDiscrete() && !_this.frame)) return;
        _this.updateView();
      },
      "change:marker.highlight": function(evt, values) {
        if (!_this.colorModel.isDiscrete()) return;

        _this.model.marker.getFrame(_this.model.time.value, frame => {
          if (frame) {
            const _hlEntities = _this.model.marker.getHighlighted(_this.KEY);
            _this.updateGroupsOpacity(_hlEntities.map(d => frame[_this.colorModel._name][d]));
          } else {
            _this.updateGroupsOpacity();
          }
        });
      },
      "translate:locale": function() {
        _this.colorPicker.translate(_this.model.locale.getTFunction());
      }
    };

    //contructor is the same as any component
    this._super(config, context);
  },

  readyOnce() {
    const _this = this;
    this.element = d3.select(this.element);

    //make color in options scrollable
    d3.select(this.placeholder.parentNode).classed("vzb-dialog-scrollable", true);

    this.colorModel = this.model.marker.color;
    this.colorlegendMarker = this.colorModel.getColorlegendMarker();
    if (this.colorlegendMarker) {
      this.colorlegendMarker.on("ready", () => {
        _this.ready();
      });
    }
    this.listColorsEl = this.element
      .append("div").attr("class", "vzb-cl-holder")
      .append("div").attr("class", "vzb-cl-colorlist");

    this.rainbowEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow");
    this.minimapEl = this.listColorsEl.append("div").attr("class", "vzb-cl-minimap");
    this.rainbowLegendEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow-legend");
    this.rainbowLegendSVG = this.rainbowLegendEl.append("svg");
    this.rainbowLegendG = this.rainbowLegendSVG.append("g");
    this.rainbowLegend = null;

    this.labelScaleEl = this.listColorsEl.append("div").attr("class", "vzb-cl-labelscale");
    this.labelScaleSVG = this.labelScaleEl.append("svg");
    this.labelScaleG = this.labelScaleSVG.append("g");
    this.unitDiv = this.listColorsEl.append("div").attr("class", "vzb-cl-unit");
    this.unitText = this.unitDiv.append("span").attr("class", "vzb-cl-unit-text");

    this.minimapSVG = this.minimapEl.append("svg");
    this.minimapG = this.minimapSVG.append("g");

    this.colorPicker = colorPicker();

    // append color picker to the tool DOM. need to check if element is already a d3 selection to not do it twice
    this.root.element instanceof Array ? this.root.element : d3.select(this.root.element)
      .call(this.colorPicker);
    this.colorPicker.translate(this.model.locale.getTFunction());
  },


  ready() {
    const _this = this;

    this.KEY = this.model.entities.getDimension();
    this.colorlegendDim = this.KEY;
    this.canShowMap = false;

    if (this.colorModel.isDiscrete() && this.colorModel.use !== "constant" && this.colorlegendMarker) {
      if (!this.colorlegendMarker._ready) return;

      this.colorlegendDim = this.colorModel.getColorlegendEntities().getDimension();

      this.colorlegendMarker.getFrame(this.model.time.value, frame => {
        _this.frame = frame;
        _this.canShowMap = utils.keys((_this.frame || {}).hook_geoshape || {}).length;

        _this.colorlegendKeys = _this.colorlegendMarker.getKeys(_this.colorlegendDim);

        _this.colorlegendKeys.forEach(d => {
          if (!((_this.frame || {}).hook_geoshape || {})[d[_this.colorlegendDim]]) _this.canShowMap = false;
        });
        _this.updateView();
        _this.updateGroupsOpacity();
      });
      return;
    }

    _this.updateView();
    _this.updateGroupsOpacity();
  },


  updateView() {
    const _this = this;
    const KEY = this.KEY;

    const palette = this.colorModel.getPalette();
    const canShowMap = this.canShowMap;

    const colorlegendKeys = this.colorlegendKeys || [];

    let colorOptions = this.listColorsEl.selectAll(".vzb-cl-option");

    //Hide and show elements of the color legend
    //Hide color legend entries if showing minimap or if color hook is a constant
    //or if using a discrete palette that would map to all entities on the chart and therefore will be too long
    //in the latter case we should show colors in the "find" list instead
    const hideColorOptions = canShowMap
      || this.colorModel.which == "_default"
      || this.colorlegendMarker && this.colorlegendDim == this.KEY
        && utils.comparePlainObjects(this.colorModel.getColorlegendEntities().getFilter(), this.model.entities.getFilter());

    colorOptions.classed("vzb-hidden", hideColorOptions);

    //Hide rainbow element if showing minimap or if color is discrete
    this.rainbowEl.classed("vzb-hidden", this.colorModel.isDiscrete());
    this.labelScaleEl.classed("vzb-hidden", this.colorModel.isDiscrete());
    this.rainbowLegendEl.classed("vzb-hidden", this.colorModel.isDiscrete());
    //Hide minimap if no data to draw it
    this.minimapEl.classed("vzb-hidden", !canShowMap || !this.colorModel.isDiscrete());

    this.unitDiv.classed("vzb-hidden", true);
    const cScale = this.colorModel.getScale();

    if (!this.colorModel.isDiscrete()) {

      const gradientWidth = this.rainbowEl.node().getBoundingClientRect().width;
      const paletteKeys = Object.keys(palette).map(parseFloat);

      let domain;
      let range;
      const formatter = this.colorModel.getTickFormatter();
      let fitIntoScale = null;

      const paletteLabels = this.colorModel.paletteLabels;

      if (paletteLabels) {

        fitIntoScale = "optimistic";

        domain = paletteLabels.map(val => parseFloat(val));
        const paletteMax = d3.max(domain);
        range = domain.map(val => val / paletteMax * gradientWidth);

      } else {

        domain = cScale.domain();
        const paletteMax = d3.max(paletteKeys);
        range = paletteKeys.map(val => val / paletteMax * gradientWidth);

      }

      const labelScaletype = (d3.min(domain) <= 0 && d3.max(domain) >= 0 && this.colorModel.scaleType === "log") ? "genericLog" : this.colorModel.scaleType;

      const labelScale = d3.scale[labelScaletype == "time" ? "linear" : labelScaletype]()
        .domain(domain)
        .range(range);

      const marginLeft = parseInt(this.rainbowEl.style("left"), 10) || 0;
      const marginRight = parseInt(this.rainbowEl.style("right"), 10) || marginLeft;

      this.labelScaleSVG.style("width", marginLeft + gradientWidth + marginRight + "px");
      this.labelScaleG.attr("transform", "translate(" + marginLeft + ",0)");
      this.rainbowLegendSVG.style("width", marginLeft + gradientWidth + marginRight + "px");
      this.rainbowLegendG.attr("transform", "translate(" + marginLeft + ", " + 7 + ")");
      const labelsAxis = axisSmart("bottom");
      labelsAxis.scale(labelScale)
        //.tickFormat(formatter)
        .tickSizeOuter(0)
        .tickPadding(6)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.colorModel.scaleType,
          toolMargin: {
            right: marginRight,
            left: marginLeft
          },
          showOuter: true,
          //bump: this.activeProfile.maxRadius/2,
          //viewportLength: gradientWidth,
          formatter,
          bump: marginLeft,
          cssFontSize: "11px",
          fitIntoScale
        });

      this.labelScaleG.call(labelsAxis);

      const colorRange = cScale.range();

      const gIndicators = range.map((val, i) => ({ val, color: colorRange[i], paletteKey: paletteKeys[i] }));
      this.rainbowLegend = this.rainbowLegendG.selectAll("circle")
        .data(gIndicators);
      this.rainbowLegend.exit().remove();
      this.rainbowLegend = this.rainbowLegend.enter().append("circle")
        .attr("r", "6px")
        .attr("stroke", "#000")
        .on("click", _this._interact().clickToChangeColor)
        .merge(this.rainbowLegend);

      this.rainbowLegend.each(function(d, i) {
        d3.select(this).attr("fill", d.color);
        d3.select(this).attr("cx", d.val);
      });

      const gColors = paletteKeys.map((val, i) => colorRange[i] + " " + d3.format("%")(val * 0.01)).join(", ");

      this.rainbowEl
        .style("background", "linear-gradient(90deg," + gColors + ")");

      const unit = this.colorModel.getConceptprops().unit || "";

      this.unitDiv.classed("vzb-hidden", unit == "");
      this.unitText.text(unit);

      colorOptions.classed("vzb-hidden", true);

    } else {

      //Check if geoshape is provided
      if (!canShowMap) {

        if (this.colorModel.which == "_default") {
          colorOptions = colorOptions.data([]);
        } else {
          colorOptions = colorOptions.data(hideColorOptions ? [] : colorlegendKeys.length ? colorlegendKeys : Object.keys(this.colorModel.getPalette()).map(value => {
            const result = {};
            result[_this.colorlegendDim] = value;
            return result;
          }), d => d[_this.colorlegendDim]);
        }

        colorOptions.exit().remove();

        colorOptions.enter().append("div").attr("class", "vzb-cl-option")
          .each(function() {
            d3.select(this).append("div").attr("class", "vzb-cl-color-sample")
              .on("click", _this._interact().clickToShow);
            d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
          })
          .on("mouseover", _this._interact().mouseover)
          .on("mouseout", _this._interact().mouseout)
          .on("click", _this._interact().clickToSelect);

        colorOptions.each(function(d, index) {
          d3.select(this).select(".vzb-cl-color-sample")
            .style("background-color", cScale(d[_this.colorlegendDim]))
            .style("border", "1px solid " + cScale(d[_this.colorlegendDim]));
          //Apply names to color legend entries if color is a property
          let label = _this.colorlegendMarker ? _this.frame.label[d[_this.colorlegendDim]] : null;
          if (!label && label !== 0) label = d[_this.colorlegendDim];
          d3.select(this).select(".vzb-cl-color-legend").text(label);
        });

      } else {

        //Drawing a minimap from the hook data

        const tempdivEl = this.minimapEl.append("div").attr("class", "vzb-temp");

        this.minimapSVG.attr("viewBox", null);
        this.minimapSVG.selectAll("g").remove();
        this.minimapG = this.minimapSVG.append("g");
        this.minimapG.selectAll("path")
          .data(colorlegendKeys, d => d[_this.colorlegendDim])
          .enter().append("path")
          .on("mouseover", _this._interact().mouseover)
          .on("mouseout", _this._interact().mouseout)
          .on("click", _this._interact().clickToSelect)
          .on("dblclick", _this._interact().clickToShow)
          .each(function(d) {
            let shapeString = _this.frame.hook_geoshape[d[_this.colorlegendDim]].trim();

            //check if shape string starts with svg tag -- then it's a complete svg
            if (shapeString.slice(0, 4) == "<svg") {
              //append svg element from string to the temporary div
              tempdivEl.html(shapeString);
              //replace the shape string with just the path data from svg
              //TODO: this is not very resilient. potentially only the first path will be taken!
              shapeString = tempdivEl.select("svg").select("path").attr("d");
            }

            d3.select(this)
              .attr("d", shapeString)
              .style("fill", cScale(d[_this.colorlegendDim]))
              .append("title").html(_this.frame.label[d[_this.colorlegendDim]]);

            tempdivEl.html("");
          });

        const gbbox = this.minimapG.node().getBBox();
        this.minimapSVG.attr("viewBox", "0 0 " + gbbox.width * 1.05 + " " + gbbox.height * 1.05);
        tempdivEl.remove();
      }
    }

  },


  _interact() {
    const _this = this;
    const KEY = this.KEY;
    const colorlegendDim = this.colorlegendDim;

    return {
      mouseover(d, i) {
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isDiscrete()) return;

        const view = d3.select(this);
        const target = d[colorlegendDim];

        const highlight = _this.colorModel.getValidItems()
          //filter so that only countries of the correct target remain
          .filter(f => f[_this.colorModel.which] == target)
          //fish out the "key" field, leave the rest behind
          .map(d => utils.clone(d, [KEY]));

        _this.model.marker.setHighlight(highlight);
      },

      mouseout(d, i) {
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isDiscrete()) return;
        _this.model.marker.clearHighlighted();
      },
      clickToChangeColor(d, i) {
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isUserSelectable()) return;
        const palette = _this.colorModel.getPalette();
        const defaultPalette = _this.colorModel.getDefaultPalette();
        const view = d3.select(this);
        const target = !_this.colorModel.isDiscrete() ? d.paletteKey : d[colorlegendDim];
        _this.colorPicker
          .colorOld(palette[target])
          .colorDef(defaultPalette[target])
          .callback((value, permanent) => {
            _this.colorModel.setColor(value, target);
          })
          .fitToScreen([d3.event.pageX, d3.event.pageY])
          .show(true);
      },
      clickToShow(d, i) {
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isDiscrete()) return;

        const view = d3.select(this);
        const target = d[colorlegendDim];

        const oldShow = _this.model.entities.show[colorlegendDim] && _this.model.entities.show[colorlegendDim]["$in"] ?
          utils.clone(_this.model.entities.show[colorlegendDim]["$in"]) :
          [];

        const entityIndex = oldShow.indexOf(d[colorlegendDim]);
        if (entityIndex !== -1) {
          oldShow.splice(entityIndex, 1);
        } else {
          oldShow.push(d[colorlegendDim]);
        }

        const show = {};
        if (oldShow.length > 0)
          show[colorlegendDim] = { "$in": oldShow };

        _this.model.entities.set({ show });

      },
      clickToSelect(d, i) {
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isDiscrete()) return;

        const view = d3.select(this);
        const target = d[colorlegendDim];

        const select = _this.colorModel.getValidItems()
          //filter so that only countries of the correct target remain
          .filter(f => f[_this.colorModel.which] == target)
          //fish out the "key" field, leave the rest behind
          .map(d => utils.clone(d, [KEY]));

        if (select.filter(d => _this.model.marker.isSelected(d)).length == select.length) {
          _this.model.marker.clearSelected();
        } else {
          _this.model.marker.setSelect(select);
        }
      }
    };
  },

  resize() {
    if (!this.colorModel.isDiscrete()) {
      this.updateView();
    }
    this.colorPicker.resize(d3.select(".vzb-colorpicker-svg"));
  },

  /**
   * Function updates the opacity of color legend elements
   * @param   {Array} value = [] array of highlighted elements
   */
  updateGroupsOpacity(highlight = []) {
    const _this = this;

    const clMarker = this.colorModel.getColorlegendMarker() || {};
    const OPACITY_REGULAR = clMarker.opacityRegular || 0.8;
    const OPACITY_DIM = clMarker.opacityHighlightDim || 0.5;
    const OPACITY_HIGHLIGHT = 1;

    const selection = _this.canShowMap ? ".vzb-cl-minimap path" : ".vzb-cl-option .vzb-cl-color-sample";

    this.listColorsEl.selectAll(selection).style("opacity", d => {
      if (!highlight.length) return OPACITY_REGULAR;
      return highlight.indexOf(d[_this.colorlegendDim]) > -1 ? OPACITY_HIGHLIGHT : OPACITY_DIM;
    });
  }

});

export default ColorLegend;
