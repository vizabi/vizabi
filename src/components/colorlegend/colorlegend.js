import * as utils from 'base/utils';
import Component from 'base/component';
import colorPicker from 'helpers/d3.colorPicker';
import worldMap from 'helpers/d3.worldMap';

/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

var INDICATOR = "which";

var ColorLegend = Component.extend({

  init: function(config, context) {
    var _this = this;
    this.template = '<div class="vzb-cl-outer"></div>';

    this.model_expects = [{
      name: "color",
      type: "color"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "language",
      type: "language"
    }];

    this.needsUpdate = false;
    this.which_1 = false;
    this.scaleType_1 = false;

    this.model_binds = {
      "change:color": function(evt) {
        _this.updateView();
      },
      "change:language": function(evt) {
        _this.updateView();
      },
      "ready": function(evt) {
        if(!_this._readyOnce) return;
        _this.updateView();
      }
    }

    //contructor is the same as any component
    this._super(config, context);
  },


  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);
    this.listColorsEl = this.element.append("div").attr("class", "vzb-cl-holder").append("div").attr("class",
      "vzb-cl-colorlist");
    this.rainbowEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow");
    this.worldmapEl = this.listColorsEl.append("div").attr("class", "vzb-cl-worldmap");

    this.colorPicker = colorPicker();
    this.element.call(this.colorPicker);

    this.worldMap = worldMap();
    this.worldmapEl.call(this.worldMap);

    this.updateView();
  },


  updateView: function() {
    var _this = this;
    this.translator = this.model.language.getTFunction();
    var KEY = this.model.entities.getDimension();

    var palette = this.model.color.palette._data;


    var whichPalette = "_default";
    if(Object.keys(this.model.color.getPalettes()).indexOf(this.model.color[INDICATOR]) > -1) {
      whichPalette = this.model.color[INDICATOR];
    }

    var paletteDefault = this.model.color.getPalettes()[whichPalette];

    this.listColorsEl.selectAll(".vzb-cl-option").remove();

    var colors = this.listColorsEl
      .selectAll(".vzb-cl-option")
      .data(utils.keys(palette), function(d) {
        return d
      });

    colors.enter().append("div").attr("class", "vzb-cl-option")
      .each(function() {
        d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
        d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
      })
      .on("mouseover", function() {
        //disable interaction if so stated in metadata
        if(!_this.model.color.isUserSelectable(whichPalette)) return;

        var sample = d3.select(this).select(".vzb-cl-color-sample");
        sample.style("border-width", "5px");
        sample.style("background-color", "transparent");

      })
      .on("mouseout", function(d) {
        //disable interaction if so stated in metadata
        if(!_this.model.color.isUserSelectable(whichPalette)) return;

        var sample = d3.select(this).select(".vzb-cl-color-sample");
        sample.style("border-width", "0px");
        sample.style("background-color", _this.model.color.palette[d]);
      })
      .on("click", function(d) {
        //disable interaction if so stated in metadata
        if(!_this.model.color.isUserSelectable(whichPalette)) return;

        _this.colorPicker
          .colorOld(palette[d])
          .colorDef(paletteDefault[d])
          .callback(function(value) {
            _this.model.color.setColor(value, d)
          })
          .show(true);
      })


    if(this.model.color.use == "indicator") {
      var gradientHeight;
      var colorOptions = this.listColorsEl.selectAll('.vzb-cl-option');
      if(colorOptions && colorOptions[0]) {
        var firstOptionSize = colorOptions[0][0].getBoundingClientRect();
        var lastOptionSize = colorOptions[0][colorOptions[0].length - 1].getBoundingClientRect();
        gradientHeight = (lastOptionSize.top + lastOptionSize.height) - firstOptionSize.top;
      }
      if(!isFinite(gradientHeight))
        gradientHeight = utils.keys(palette).length * 25 + 5;
      this.rainbowEl.classed("vzb-hidden", false)
        .style("height", gradientHeight + "px")
        .style("background", "linear-gradient(" + utils.values(palette).join(", ") + ")");
    } else {
      this.rainbowEl.classed("vzb-hidden", true);
    }

    //TODO: is it okay that "geo.region" is hardcoded?
    if(this.model.color[INDICATOR] == "geo.region") {
      var regions = this.worldmapEl.classed("vzb-hidden", false)
        .select("svg").selectAll("path");
      regions.each(function() {
          var view = d3.select(this);
          var color = palette[view.attr("id")];
          view.style("fill", color);
        })
        .style("opacity", .8)
        .on("mouseover", function() {
          var view = d3.select(this);
          var region = view.attr("id");
          regions.style("opacity", .5);
          view.style("opacity", 1);

          var filtered = _this.model.color.getNestedItems([KEY]);
          var highlight = utils.values(filtered)
            //returns a function over time. pick the last time-value
            .map(function(d) {
              return d[d.length - 1]
            })
            //filter so that only countries of the correct region remain
            .filter(function(f) {
              return f["geo.region"] == region
            })
            //fish out the "key" field, leave the rest behind
            .map(function(d) {
              return utils.clone(d, [KEY])
            });

          _this.model.entities.setHighlighted(highlight);
        })
        .on("mouseout", function() {
          regions.style("opacity", .8);
          _this.model.entities.clearHighlighted();
        })
        .on("click", function(d) {
          //disable interaction if so stated in metadata
          if(!_this.model.color.isUserSelectable(whichPalette)) return;
          var view = d3.select(this);
          var region = view.attr("id")

          _this.colorPicker
            .colorOld(palette[region])
            .colorDef(paletteDefault[region])
            .callback(function(value) {
              _this.model.color.setColor(value, region)
            })
            .show(true);
        })
      colors.classed("vzb-hidden", true);
    } else {
      this.worldmapEl.classed("vzb-hidden", true);
      colors.classed("vzb-hidden", false);
    }

    colors.each(function(d, index) {
      d3.select(this).select(".vzb-cl-color-sample")
        .style("background-color", palette[d])
        .style("border", "1px solid " + palette[d]);

      if(_this.model.color.use == "indicator") {
        var domain = _this.model.color.getScale().domain();
        d3.select(this).select(".vzb-cl-color-legend")
          .text(_this.model.color.tickFormatter(domain[index]))
      } else {

        d3.select(this).select(".vzb-cl-color-legend")
          .text(_this.translator("color/" + d));
      }
    });
  }

});

export default ColorLegend;