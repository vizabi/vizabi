import * as utils from 'base/utils';
import Component from 'base/component';
import colorPicker from 'helpers/d3.colorPicker';
import axisSmart from 'helpers/d3.axisWithLabelPicker';

/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

var OPACITY_REGULAR = 0.8;
var OPACITY_DIM = 0.5;
var OPACITY_HIGHLIGHT = 1;

var ColorLegend = Component.extend({

  init: function(config, context) {
    var _this = this;
    this.template = '<div class="vzb-cl-outer"></div>';
    this.name = 'colorlegend';

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
        name: "language",
        type: "language"
      }];

    this.needsUpdate = false;
    this.which_1 = false;
    this.scaleType_1 = false;

    this.model_binds = {
      "change:marker.color.scaleType": function(evt, path) {
        if(!_this._readyOnce || _this.colorModel.use !== "indicator") return;
        _this.updateView();
      },
      "change:marker.color.palette": function(evt, path) {
        if(!_this._readyOnce || !_this.frame) return;
        _this.updateView();
      },
      "change:entities.highlight": function(evt, values) {
        if(_this.colorModel.use !== "property") return;
        var _highlightedEntity = _this.model.entities.getHighlighted();
        if(_highlightedEntity.length > 1) return;

        if(_highlightedEntity.length) {
            _this.model.marker.getFrame(_this.model.time.value, function(frame) {
              if(!frame) return;

              var _highlightedEntity = _this.model.entities.getHighlighted();
              if(_highlightedEntity.length) {
                _this.updateGroupsOpacity(frame["color"][_highlightedEntity[0]]);
              }
            });
        } else if (values !== null && values !== "highlight") {
          _this.updateGroupsOpacity(values["color"]);
        } else {
          _this.updateGroupsOpacity();
        }
      }
    };

    //contructor is the same as any component
    this._super(config, context);
  },

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);

    //make color in options scrollable
    d3.select(this.placeholder.parentNode).classed("vzb-dialog-scrollable", true);

    this.colorModel = this.model.marker.color;
    this.colorlegendMarker = this.colorModel.getColorlegendMarker();
    if(this.colorlegendMarker) {
      this.colorlegendMarker.on('ready', function() {
        _this.ready();
      });
    }
    this.listColorsEl = this.element
      .append("div").attr("class", "vzb-cl-holder")
      .append("div").attr("class","vzb-cl-colorlist");

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
    this.unitText = this.unitDiv.append("text").attr("class", "vzb-cl-unit-text");

    this.minimapSVG = this.minimapEl.append("svg");
    this.minimapG = this.minimapSVG.append("g");

    this.colorPicker = colorPicker();

    // append color picker to the tool DOM. need to check if element is already a d3 selection to not do it twice
    this.root.element instanceof Array? this.root.element : d3.select(this.root.element)
      .call(this.colorPicker);

    OPACITY_DIM = this.model.entities.opacitySelectDim;
  },


  ready: function(){
    var _this = this;

    this.KEY = this.model.entities.getDimension();
    this.colorlegendDim = this.KEY;
    this.canShowMap = false;

    if(this.colorModel.use == "property" && this.colorlegendMarker) {
      if(!this.colorlegendMarker._ready) return;

      this.colorlegendDim = this.colorModel.getColorlegendEntities().getDimension();

      this.colorlegendMarker.getFrame(this.model.time.value, function(frame) {
        _this.frame = frame;
        _this.canShowMap = utils.keys((_this.frame||{}).hook_geoshape||{}).length;

        _this.colorlegendKeys = _this.colorlegendMarker.getKeys(_this.colorlegendDim);

        _this.colorlegendKeys.forEach(function(d){
          if(!((_this.frame||{}).hook_geoshape||{})[d[_this.colorlegendDim]]) _this.canShowMap = false;
        });
        _this.updateView();
      });
      return;
    }

    _this.updateView();
  },


  updateView: function() {
    var _this = this;
    var KEY = this.KEY;

    var palette = this.colorModel.getPalette();
    var canShowMap = this.canShowMap;

    var colorlegendKeys = this.colorlegendKeys || [];

    var colorOptions = this.listColorsEl.selectAll(".vzb-cl-option");

    //Hide and show elements of the color legend
    //Hide color legend entries if showing minimap or if color hook is a constant
    //or if using a discrete palette that would map to all entities on the chart and therefore will be too long
    //in the latter case we should show colors in the "find" list instead
    var hideColorOptions = canShowMap
      || this.colorModel.which == "_default"
      || this.colorlegendMarker && this.colorlegendDim == this.KEY
        && utils.comparePlainObjects(this.colorModel.getColorlegendEntities().getFilter(), this.model.entities.getFilter());

    colorOptions.classed("vzb-hidden", hideColorOptions);

    //Hide rainbow element if showing minimap or if color is discrete
    this.rainbowEl.classed("vzb-hidden", this.colorModel.use !== "indicator");
    this.labelScaleEl.classed("vzb-hidden", this.colorModel.use !== "indicator")
    this.rainbowLegendEl.classed("vzb-hidden", this.colorModel.use !== "indicator");
    //Hide minimap if no data to draw it
    this.minimapEl.classed("vzb-hidden", !canShowMap || this.colorModel.use == "indicator");

    this.unitDiv.classed("vzb-hidden", true);
    var cScale = this.colorModel.getScale();

    if(this.colorModel.use == "indicator") {

      var gradientWidth = this.rainbowEl.node().getBoundingClientRect().width;
      var paletteKeys = Object.keys(palette).map(parseFloat);

      var domain;
      var range;
      var labelScale;
      var formatter = this.colorModel.getTickFormatter();
      var fitIntoScale = null;

      var paletteLabels = this.colorModel.paletteLabels;

      if(paletteLabels) {

        fitIntoScale = "optimistic";

        domain = paletteLabels.map(function(val) {
          return parseFloat(val);
        });
        var paletteMax = d3.max(domain);
        range = domain.map(function(val) {
          return val / paletteMax * gradientWidth;
        });

      } else {

        domain = cScale.domain();
        var paletteMax = d3.max(paletteKeys);
        range = paletteKeys.map(function(val) {
          return val / paletteMax * gradientWidth;
        });

      }

      var labelScaletype = (d3.min(domain)<=0 && d3.max(domain)>=0 && this.colorModel.scaleType === "log")? "genericLog" : this.colorModel.scaleType;

      labelScale = d3.scale[labelScaletype == "time" ? "linear" : labelScaletype]()
        .domain(domain)
        .range(range);

      var marginLeft = parseInt(this.rainbowEl.style('left'), 10) || 0;
      var marginRight = parseInt(this.rainbowEl.style('right'), 10) || marginLeft;

      this.labelScaleSVG.style("width", marginLeft + gradientWidth + marginRight + "px");
      this.labelScaleG.attr("transform","translate(" + marginLeft + ",0)");
      this.rainbowLegendSVG.style("width", marginLeft + gradientWidth + marginRight + "px");
      this.rainbowLegendG.attr("transform","translate(" + marginLeft + ", " + 7 + ")");
      var labelsAxis = axisSmart();
      labelsAxis.scale(labelScale)
        .orient("bottom")
        //.tickFormat(formatter)
        .tickSize(6, 0)
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
          formatter: formatter,
          bump: marginLeft,
          cssFontSize: "11px",
          fitIntoScale: fitIntoScale
        });

      this.labelScaleG.call(labelsAxis);

      var colorRange = cScale.range();

      var gIndicators = range.map(function(val, i) {
        return {val: val, color: colorRange[i], paletteKey: paletteKeys[i]}
      });
      this.rainbowLegend = this.rainbowLegendG.selectAll('circle')
        .data(gIndicators);
      this.rainbowLegend.exit().remove();
      this.rainbowLegend.enter().append("circle")
        .attr('r', "6px")
        .attr('stroke', '#000')
        .on("click", _this._interact().click);

      this.rainbowLegend.each(function(d, i) {
        d3.select(this).attr('fill', d.color);
        d3.select(this).attr('cx', d.val);
      });

      var gColors = paletteKeys.map(function(val, i) {
        return colorRange[i] + " " + d3.format("%")(val * .01);
      }).join(", ");

      this.rainbowEl
        .style("background", "linear-gradient(90deg," + gColors + ")");

      var unit = this.colorModel.getConceptprops().unit || "";

      this.unitDiv.classed("vzb-hidden", unit == "");
      this.unitText.text(unit);

      //Apply names as formatted numbers
      // colorOptions.each(function(d, index) {
      //   d3.select(this).select(".vzb-cl-color-legend")
      //     .text(_this.colorModel.getTickFormatter()(domain[index]))
      // });
      colorOptions.classed("vzb-hidden", true);

    } else {

      //Check if geoshape is provided
      if(!canShowMap) {

        if(this.colorModel.which == "_default") {
          colorOptions = colorOptions.data([]);
        }else{
          colorOptions = colorOptions.data(hideColorOptions? [] : colorlegendKeys.length ? colorlegendKeys : Object.keys(this.colorModel.getPalette()).map(function(value) {
            var result = {};
            result[_this.colorlegendDim] = value;
            return result;
          }), function(d) {return d[_this.colorlegendDim]});
        }

        colorOptions.exit().remove();

        colorOptions.enter().append("div").attr("class", "vzb-cl-option")
          .each(function() {
            d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
            d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
          })
          .on("mouseover", _this._interact().mouseover)
          .on("mouseout", _this._interact().mouseout)
          .on("click", _this._interact().click);

        var labelsAvailable = !!(_this.frame||{}).label;

        colorOptions.each(function(d, index) {
          d3.select(this).select(".vzb-cl-color-sample")
            .style("background-color", cScale(d[_this.colorlegendDim]))
            .style("border", "1px solid " + cScale(d[_this.colorlegendDim]));
          //Apply names to color legend entries if color is a property
          var label = _this.colorlegendMarker ? _this.frame.label[d[_this.colorlegendDim]] : null;
          if(!label && label!==0) labelsAvailable = false;
          d3.select(this).select(".vzb-cl-color-legend").text(label);
        });

        //switch to compact mode (remove labels) when we have no labels to show
        colorOptions.classed("vzb-cl-compact", !labelsAvailable);

      } else {

        //Drawing a minimap from the hook data

        var tempdivEl = this.minimapEl.append("div").attr("class","vzb-temp");

        this.minimapSVG.attr("viewBox",null)
        this.minimapSVG.selectAll("g").remove()
        this.minimapG = this.minimapSVG.append("g");
        this.minimapG.selectAll("path")
          .data(colorlegendKeys, function(d) {return d[_this.colorlegendDim]})
          .enter().append("path")
          .style("opacity", OPACITY_REGULAR)
          .on("mouseover", _this._interact().mouseover)
          .on("mouseout", _this._interact().mouseout)
          .on("click", _this._interact().click)
          .each(function(d){
            var shapeString = _this.frame.hook_geoshape[d[_this.colorlegendDim]].trim();

            //check if shape string starts with svg tag -- then it's a complete svg
            if(shapeString.slice(0,4) == "<svg"){
              //append svg element from string to the temporary div
              tempdivEl.html(shapeString);
              //replace the shape string with just the path data from svg
              //TODO: this is not very resilient. potentially only the first path will be taken!
              shapeString = tempdivEl.select("svg").select("path").attr("d")
            }

            d3.select(this)
              .attr("d", shapeString)
              .style("fill", cScale(d[_this.colorlegendDim]))

            tempdivEl.html("");
          })

        var gbbox = this.minimapG.node().getBBox();
        this.minimapSVG.attr("viewBox", "0 0 " + gbbox.width*1.05 + " " + gbbox.height*1.05);
        tempdivEl.remove();
      }
    }

  },


  _interact: function() {
    var _this = this;
    var KEY = this.KEY;
    var colorlegendDim = this.colorlegendDim;

    return {
      mouseover: function(d, i) {
        //disable interaction if so stated in concept properties
        if(_this.colorModel.use === "indicator") return;

        var view = d3.select(this);
        var target = d[colorlegendDim];
        _this.listColorsEl.selectAll(".vzb-cl-option").style("opacity", OPACITY_DIM);
        _this.minimapG.selectAll("path").style("opacity", OPACITY_DIM);
        view.style("opacity", OPACITY_HIGHLIGHT);

        var highlight = _this.colorModel.getValidItems()
          //filter so that only countries of the correct target remain
          .filter(function(f) {
            return f[_this.colorModel.which] == target
          })
          //fish out the "key" field, leave the rest behind
          .map(function(d) {
            return utils.clone(d, [KEY]);
          });

        _this.model.entities.setHighlight(highlight);
      },

      mouseout: function(d, i) {
        //disable interaction if so stated in concept properties
        if(_this.colorModel.use === "indicator") return;

        _this.listColorsEl.selectAll(".vzb-cl-option").style("opacity", OPACITY_REGULAR);
        _this.minimapG.selectAll("path").style("opacity", OPACITY_REGULAR);
        _this.model.entities.clearHighlighted();
      },
      click: function(d, i) {
        //disable interaction if so stated in concept properties
        if(!_this.colorModel.isUserSelectable()) return;
        var palette = _this.colorModel.getPalette();
        var defaultPalette = _this.colorModel.getDefaultPalette();
        var view = d3.select(this);
        var target = _this.colorModel.use === "indicator"? d.paletteKey : d[colorlegendDim];
        _this.colorPicker
          .colorOld(palette[target])
          .colorDef(defaultPalette[target])
          .callback(function(value, permanent) {
            _this.colorModel.setColor(value, target)
          })
          .fitToScreen([d3.event.pageX, d3.event.pageY])
          .show(true);
      }
    }
  },

  resize: function() {
    if(this.colorModel.use == "indicator") {
      this.updateView();
    }
    this.colorPicker.resize(d3.select('.vzb-colorpicker-svg'));
  },

  updateGroupsOpacity: function(value) {
    var _this = this;
    var selection = _this.canShowMap ? ".vzb-cl-minimap path" : ".vzb-cl-option";

    if(arguments.length) {
      this.listColorsEl.selectAll(".vzb-cl-option").style("opacity", OPACITY_DIM);
      this.minimapG.selectAll("path").style("opacity", OPACITY_DIM);
      this.listColorsEl.selectAll(selection).filter(function(d) {
        return d[_this.colorlegendDim] == value;
      }).each(function(d, i) {
        var view = d3.select(this);
        view.style("opacity", OPACITY_HIGHLIGHT);
      });
    } else {
      this.listColorsEl.selectAll(".vzb-cl-option").style("opacity", OPACITY_HIGHLIGHT);
      this.minimapG.selectAll("path").style("opacity", OPACITY_REGULAR);
    }

  }

});

export default ColorLegend;
