import * as utils from "base/utils";
import Component from "base/component";
import ColorPicker from "helpers/d3.colorPicker";
import axisSmart from "helpers/d3.axisWithLabelPicker";
import { close as iconClose } from "base/iconset";

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
      type: "marker"
    }, {
      name: "color",
      type: "color"
    }, {
      name: "locale",
      type: "locale"
    }, {
      name: "ui",
      type: "ui",
    }];

    this.model_binds = {
      "change:color.scaleType": function(evt, path) {
        if (!_this._readyOnce || _this.colorModel.isDiscrete()) return;
        _this.updateView();
      },
      "change:color.palette": function(evt, path) {
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
      "change:time.start": function(evt, original) {
        if (!_this._readyOnce || _this.model.time.splash) return;
        if (_this.colorModel.which == _this.model.time.dim) {
          _this.ready();
        }
      },
      "change:time.end": function(evt, original) {
        if (!_this._readyOnce || _this.model.time.splash) return;
        if (_this.colorModel.which == _this.model.time.dim) {
          _this.ready();
        }
      },
      "translate:locale": function() {
        _this._translateSelectDialog(_this.model.locale.getTFunction());
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

    this.colorModel = this.model.color;
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
    this.rainbowCanvasEl = this.rainbowEl.append("canvas");
    this.minimapEl = this.listColorsEl.append("div").attr("class", "vzb-cl-minimap");
    this.rainbowLegendEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow-legend");
    this.rainbowLegendSVG = this.rainbowLegendEl.append("svg");
    this.rainbowLegendG = this.rainbowLegendSVG.append("g");
    this.rainbowLegend = null;

    this.labelScaleEl = this.listColorsEl.append("div").attr("class", "vzb-cl-labelscale");
    this.labelScaleSVG = this.labelScaleEl.append("svg");
    this.labelScaleG = this.labelScaleSVG.append("g");
    this.subtitleDiv = this.listColorsEl.append("div").attr("class", "vzb-cl-subtitle");
    this.subtitleText = this.subtitleDiv.append("span").attr("class", "vzb-cl-subtitle-text");

    this.minimapSVG = this.minimapEl.append("svg");
    this.minimapG = this.minimapSVG.append("g");

    this.colorPicker = new ColorPicker(
      utils.isArray(this.root.element) ?
        this.root.element :
        d3.select(this.root.element)
    );

    this.colorPicker.translate(this.model.locale.getTFunction());
    this._initSelectDialog();
  },

  _initSelectDialog() {
    this.moreOptionsHint = this.listColorsEl.append("span")
      .classed("vzb-cl-more-hint vzb-hidden", true);

    this.selectDialog = this.listColorsEl.append("div").classed("vzb-cl-select-dialog vzb-hidden", true);
    this._initSelectDialogItems();
    this._translateSelectDialog(this.model.locale.getTFunction());
  },

  _initSelectDialogItems() {
    this.selectDialogTitle = this.selectDialog.append("div")
      .classed("vzb-cl-select-dialog-title", true);

    this.selectDialog.append("div")
      .classed("vzb-cl-select-dialog-close", true)
      .html(iconClose)
      .on("click", () => this._closeSelectDialog());

    this.selectAllButton = this.selectDialog.append("div")
      .classed("vzb-cl-select-dialog-item", true);

    this.removeElseButton = this.selectDialog.append("div")
      .classed("vzb-cl-select-dialog-item", true);

    this.editColorButton = this.selectDialog.append("div")
      .classed("vzb-cl-select-dialog-item vzb-cl-select-dialog-item-moreoptions", true);

    this.editColorButtonTooltip = this.editColorButton.append("div")
      .classed("vzb-cl-select-dialog-item-tooltip", true);
  },

  _translateSelectDialog(t) {
    this.moreOptionsHint.text(t("hints/color/more"));
    this.selectAllButton.text("✅ " + t("dialogs/color/select-all"));
    this.removeElseButton.text("🗑️ " + t("dialogs/color/remove-else"));
    this.editColorButton.text("🎨 " + t("dialogs/color/edit-color"));
    this.editColorButtonTooltip.text("Dataset author doesn't want you to change this");
  },

  _closeSelectDialog() {
    this.selectDialog.classed("vzb-hidden", true);
  },

  _bindSelectDialogItems(...args) {
    const [, index, indicators] = args;
    this.selectDialogTitle.text(indicators[index].textContent);

    this.selectAllButton.on("click", () => {
      this._interact().clickToSelect(...args);
      this._closeSelectDialog();
    });

    this.removeElseButton.on("click", () => {
      this._interact().clickToShow(...args);
      this._closeSelectDialog();
    });

    this.editColorButton.on("click", () => {
      this._interact().clickToChangeColor(...args);
      this._closeSelectDialog();
    });
  },

  ready() {
    const _this = this;

    this.KEYS = utils.unique(this.model.marker._getAllDimensions({ exceptType: "time" }));
    this.KEY = this.KEYS.join(",");
    this.colorlegendDim = this.KEY;
    this.canShowMap = false;

    if (this.colorModel.isDiscrete() && this.colorModel.use !== "constant" && this.colorlegendMarker) {
      if (!this.colorlegendMarker._ready) return;

      this.markerKeys = _this.model.marker.getKeys();
      this.KEY = _this.colorModel.getDataKeys()[0];

      this.colorlegendDim = this.colorModel.getColorlegendEntities().getDimension();

      this.colorlegendMarker.getFrame(this.model.time.value, frame => {
        if (!frame) return utils.warn("colorlegend received empty frame in ready()");
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
    if (!this.element.selectAll) return utils.warn("colorlegend resize() aborted because element is not yet defined");

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
        && colorlegendKeys.length > 10 && utils.comparePlainObjects(this.colorModel.getColorlegendEntities().getFilter(), this.model.entities.getFilter());

    colorOptions.classed("vzb-hidden", hideColorOptions);

    this._updateSelectDialog();

    //Hide rainbow element if showing minimap or if color is discrete
    this.rainbowEl.classed("vzb-hidden", this.colorModel.isDiscrete());
    this.labelScaleEl.classed("vzb-hidden", this.colorModel.isDiscrete());
    this.rainbowLegendEl.classed("vzb-hidden", this.colorModel.isDiscrete());
    //Hide minimap if no data to draw it
    this.minimapEl.classed("vzb-hidden", !canShowMap || !this.colorModel.isDiscrete());

    this.subtitleDiv.classed("vzb-hidden", true);
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

      const labelScaleType = (d3.min(domain) <= 0 && d3.max(domain) >= 0 && this.colorModel.scaleType === "log") ? "genericLog" : this.colorModel.scaleType;

      const labelScale = d3[`scale${utils.capitalize(labelScaleType === "time" ? "linear" : labelScaleType)}`]()
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

      this.rainbowCanvasEl
        .attr("width", gradientWidth)
        .attr("height", 1)
        .style("width", gradientWidth + "px")
        .style("height", "100%");

      const context = this.rainbowCanvasEl.node().getContext("2d");
      const image = context.createImageData(gradientWidth, 1);
      for (let i = 0, j = -1, c; i < gradientWidth; ++i) {
        c = d3.rgb(cScale(labelScale.invert(i)));
        image.data[++j] = c.r;
        image.data[++j] = c.g;
        image.data[++j] = c.b;
        image.data[++j] = 255;
      }
      context.putImageData(image, 0, 0);

      const conceptProps = this.colorModel.getConceptprops();
      const subtitle = utils.getSubtitle(conceptProps.name, conceptProps.name_short);

      this.subtitleDiv.classed("vzb-hidden", subtitle == "");
      this.subtitleText.text(subtitle);

      colorOptions.classed("vzb-hidden", true);

    } else {

      //Check if geoshape is provided
      if (!canShowMap) {

        if (this.colorModel.which == "_default") {
          colorOptions = colorOptions.data([]);
        } else {
          colorOptions = colorOptions.data(hideColorOptions ? [] : colorlegendKeys.length ? _this.colorlegendDim == KEY ? utils.unique(_this.markerKeys, key => key[KEY]) : colorlegendKeys : Object.keys(this.colorModel.getPalette()).map(value => {
            const result = {};
            result[_this.colorlegendDim] = value;
            return result;
          }), d => d[_this.colorlegendDim]);
        }

        colorOptions.exit().remove();

        colorOptions = colorOptions.enter().append("div").attr("class", "vzb-cl-option")
          .each(function() {
            d3.select(this).append("div").attr("class", "vzb-cl-color-sample")
              .on("click", (...args) => {
                this._bindSelectDialogItems(...args);
                this.selectDialog.classed("vzb-hidden", false);
              });
            d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
          })
          .on("mouseover", _this._interact().mouseover)
          .on("mouseout", _this._interact().mouseout)
          .on("click", (...args) => {
            this._bindSelectDialogItems(...args);
            this.selectDialog.classed("vzb-hidden", false);
          })
          .merge(colorOptions);

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
          .on("click", (...args) => {
            this._bindSelectDialogItems(...args);
            this.selectDialog.classed("vzb-hidden", false);
          })
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
              .append("title").text(_this.frame.label[d[_this.colorlegendDim]]);

            tempdivEl.html("");
          });

        const gbbox = this.minimapG.node().getBBox();
        this.minimapSVG.attr("viewBox", "0 0 " + gbbox.width * 1.05 + " " + gbbox.height * 1.05);
        tempdivEl.remove();
      }
    }

  },

  _updateSelectDialog() {
    const isColorSelectable = this.colorModel.isUserSelectable();
    this.editColorButtonTooltip.classed("vzb-hidden", isColorSelectable);
    this.editColorButton.classed("vzb-cl-select-dialog-item-disabled", !isColorSelectable);

    this.selectDialog.classed("vzb-hidden", true);
  },

  _highlight(values) {
    utils.getProp(this, ["model", "ui", "chart", "superhighlightOnMinimapHover"]) ?
      this.model.marker.setSuperHighlight(values) :
      this.model.marker.setHighlight(values);
  },

  _unhighlight() {
    utils.getProp(this, ["model", "ui", "chart", "superhighlightOnMinimapHover"]) ?
      this.model.marker.clearSuperHighlighted() :
      this.model.marker.clearHighlighted();
  },

  _interact() {
    const _this = this;
    const KEYS = this.KEYS;
    const KEY = this.KEY;
    const colorlegendDim = this.colorlegendDim;

    return {
      mouseover(d, i) {
        _this.moreOptionsHint.classed("vzb-hidden", false);
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isDiscrete()) return;

        const view = d3.select(this);
        const target = d[colorlegendDim];

        const filterHash = _this.colorModel.getValidItems()
          //filter so that only countries of the correct target remain
          .filter(f => f[_this.colorModel.which] == target)
          .reduce((result, d) => {
            result[d[KEY]] = true;
            return result;
          }, {});

        _this._highlight(_this.markerKeys.filter(key => filterHash[key[KEY]]));
      },

      mouseout(d, i) {
        _this.moreOptionsHint.classed("vzb-hidden", true);
        //disable interaction if so stated in concept properties
        if (!_this.colorModel.isDiscrete()) return;
        _this._unhighlight();
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
          .callback((value, isClick) => _this.colorModel.setColor(value, target, isClick))
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

        const filterHash = _this.colorModel.getValidItems()
          //filter so that only countries of the correct target remain
          .filter(f => f[_this.colorModel.which] == target)
          //fish out the "key" field, leave the rest behind
          .reduce((result, d) => {
            result[d[KEY]] = true;
            return result;
          }, {});

        const select = _this.markerKeys.filter(f => filterHash[f[KEY]])
          .map(d => utils.clone(d, KEYS));

        if (select.filter(d => _this.model.marker.isSelected(d)).length == select.length) {
          _this.model.marker.clearSelected();
        } else {
          _this.model.marker.setSelect(select);
        }
      }
    };
  },

  resize() {
    if (this.frame) this.updateView();
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
