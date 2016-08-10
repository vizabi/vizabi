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
      name: "state",
      type: "model"
    }, {
      name: "language",
      type: "language"
    }];

    this.needsUpdate = false;
    this.which_1 = false;
    this.scaleType_1 = false;

    this.model_binds = {
      "change:state.marker.color.scaleType": function(evt, path) {
        if(!_this._readyOnce) return;
        _this.updateView();
      },
      "change:state.marker.color.which": function(evt, path) {
        if(!_this._readyOnce) return;
        if(_this.model.state.entities_minimap) {
          _this.forwardModelUpdate();
        }else{
          _this.updateView();
        }
      },
      "change:state.marker.color.palette": function(evt, path) {
        if(!_this._readyOnce) return;
        _this.updateView();
      },
      "change:language.strings": function(evt) {
        this.translator = this.model.language.getTFunction();
        _this.updateView();
      }
    }
    
    //contructor is the same as any component
    this._super(config, context);
  },
  
  forwardModelUpdate: function(){
    if(this.colorModel.use === "property"){
      this.model.state.entities_minimap.show[ this.colorModel.which.replace(this.KEY+".", this.KEY+".is--") ] = true;
    }
  },


  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);
    
    this.translator = this.model.language.getTFunction();
    
    this.markerModel = this.model.state.marker_minimap ? this.model.state.marker_minimap : this.model.state.marker;
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

    this.KEY = this.model.state.entities.getDimension();
    this.colorModel = this.model.state.marker.color;
    
    OPACITY_REGULAR = this.model.state.entities.opacityRegular;
    OPACITY_DIM = this.model.state.entities.opacitySelectDim;
    OPACITY_HIGHLIGHT = 1;
    
  },
  
  
  ready: function(){
    var _this = this;
    if(this.model.state.marker_minimap){
      var minimapDim = this.model.state.marker_minimap._getFirstDimension();
      var timeModel = this.model.state.time;
      var filter = {};
      filter[timeModel.getDimension()] = timeModel.value;
      _this.frame = this.model.state.marker_minimap.getValues(filter,[minimapDim]);
    }
    _this.updateView();
  },


  updateView: function() {
    var _this = this;
    var KEY = this.KEY;

    var palette = this.colorModel.getPalette();
    var canShowMap = utils.keys((this.frame||{}).geoshape||{}).length && this.colorModel.use == "property";

    var minimapKeys = [];

    if(this.model.state.marker_minimap){
      var minimapDim = this.model.state.marker_minimap._getFirstDimension();
      var minimapKeys = this.model.state.marker_minimap.getKeys(minimapDim);
    }
    
    minimapKeys.forEach(function(d){
      if(!((_this.frame||{}).geoshape||{})[d[_this.KEY]]) canShowMap = false;
    });
    

    var colorOptions = this.listColorsEl.selectAll(".vzb-cl-option");
    
    //Hide and show elements of the color legend
    //Hide color legend entries if showing minimap or if color hook is a constant
    colorOptions.classed("vzb-hidden", canShowMap || this.colorModel.which == "_default");
    //Hide rainbow element if showing minimap or if color is discrete
    //TODO: indocators-properties are incorrectly used here.
    this.rainbowEl.classed("vzb-hidden", canShowMap || this.colorModel.use !== "indicator");
    this.rainbowLegendEl.classed("vzb-hidden", canShowMap || this.colorModel.use !== "indicator");
    //Hide minimap if no data to draw it
    this.minimapEl.classed("vzb-hidden", !canShowMap);
    
    this.labelScaleEl.classed("vzb-hidden", canShowMap || this.colorModel.use !== "indicator")
    this.unitDiv.classed("vzb-hidden", true);

    //Check if geoshape is provided
    if(!canShowMap) {
      if(this.colorModel.which == "_default") {
        colorOptions = colorOptions.data([]); 
      }else if(this.colorModel.use == "indicator" || !minimapKeys.length) {
        colorOptions = colorOptions.data(utils.keys(this.colorModel.getScale().range()), function(d) {return d});
      }else{
        colorOptions = colorOptions.data(minimapKeys, function(d) {return d[minimapDim]});
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

      colorOptions.each(function(d, index) {
        d3.select(this).select(".vzb-cl-color-sample")
          .style("background-color", palette[d[_this.KEY]||d[minimapDim]||d])
          .style("border", "1px solid " + palette[d[_this.KEY]||d[minimapDim]||d]);
      }); 
      
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

          domain = _this.colorModel.getScale().domain();
          var paletteMax = d3.max(paletteKeys);
          range = paletteKeys.map(function(val) {
            return val / paletteMax * gradientWidth;
          });

        }
          
        labelScale = d3.scale[this.colorModel.scaleType == "time" ? "linear" : this.colorModel.scaleType]()
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
            //constantRakeLength: gradientWidth,
            formatter: formatter,
            bump: marginLeft,
            cssFontSize: "11px",
            fitIntoScale: fitIntoScale
          });
              
        this.labelScaleG.call(labelsAxis);

        var colorRange = _this.colorModel.getScale().range();

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
        //Calculate the hight for the rainbow gradient
        // var gradientHeight;
        // if(colorOptions && colorOptions[0]) {
        //   var firstOptionSize = colorOptions[0][0].getBoundingClientRect();
        //   var  = colorOptions[0][colorOptions[0].length - 1].getBoundingClientRect();
        //   gradientHeight = lastOptionSize.bottom - firstOptionSize.top;
        // }
        // if(!isFinite(gradientHeight)) gradientHeight = utils.keys(palette).length * 25 + 5;
        
        this.rainbowEl
          .style("background", "linear-gradient(90deg," + gColors + ")");
        
        var unit = this.translator("unit/" + this.colorModel.which)
        
        this.unitDiv.classed("vzb-hidden", unit == "");
        this.unitText.text(unit);

        //Apply names as formatted numbers 
        // colorOptions.each(function(d, index) {
        //   d3.select(this).select(".vzb-cl-color-legend")
        //     .text(_this.colorModel.getTickFormatter()(domain[index]))
        // });
        colorOptions.classed("vzb-hidden", true);

      } else {
        
        //Apply names to color legend entries if color is a property
        colorOptions.each(function(d, index) {
          d3.select(this).select(".vzb-cl-color-legend")
            .text(_this.frame.label[d[_this.KEY]||d[minimapDim]]);
        });
        
        
        //if using a discrete palette that is not supplied from concept properties but from defaults
        colorOptions.classed("vzb-cl-compact", !(this.colorModel.getConceptprops().color||{}).palette );
      }
      

    }else{
      
      //Drawing a minimap from the hook data
      
      var tempdivEl = this.minimapEl.append("div").attr("class","vzb-temp");
      
      this.minimapSVG.attr("viewBox",null)
      this.minimapSVG.selectAll("g").remove()
      this.minimapG = this.minimapSVG.append("g");
      this.minimapG.selectAll("path")
        .data(minimapKeys, function(d) {return d[KEY]})
        .enter().append("path")
        .style("opacity", OPACITY_REGULAR)
        .on("mouseover", _this._interact().mouseover)
        .on("mouseout", _this._interact().mouseout)
        .on("click", _this._interact().click)
        .each(function(d){
          tempdivEl.html(_this.frame.geoshape[d[_this.KEY]]);
          var color = palette[d[_this.KEY]];
          
          d3.select(this)
            .attr("d", tempdivEl.select("svg").select("path").attr("d"))
            .style("fill", utils.isArray(color)? color[0] : color)
        
          tempdivEl.html("");
        })
      
      var gbbox = this.minimapG.node().getBBox();
      this.minimapSVG.attr("viewBox", "0 0 " + gbbox.width*1.05 + " " + gbbox.height*1.05);
      tempdivEl.remove();
    }
      
  },
  
  
  _interact: function() {
    var _this = this;
    var KEY = this.KEY;
    var palette = this.colorModel.getPalette();
    var paletteDefault = this.colorModel.getDefaultPalette();

    return {
      mouseover: function(d, i) {
        //disable interaction if so stated in concept properties
        if(_this.colorModel.use === "indicator") return;
        
        var view = d3.select(this);
        var target = d[KEY];
        _this.listColorsEl.selectAll(".vzb-cl-option").style("opacity", OPACITY_DIM);
        _this.minimapG.selectAll("path").style("opacity", OPACITY_DIM);
        view.style("opacity", OPACITY_HIGHLIGHT);

        var filtered = _this.colorModel.getNestedItems([KEY]);
        var highlight = utils.values(filtered)
          //returns a function over time. pick the last time-value
          .map(function(d) {
            return d[d.length - 1]
          })
          //filter so that only countries of the correct target remain
          .filter(function(f) {
            return f[_this.colorModel.which] == target
          })
          //fish out the "key" field, leave the rest behind
          .map(function(d) {
            return utils.clone(d, [KEY])
          });

        _this.model.state.entities.setHighlight(highlight);
      },

      mouseout: function(d, i) {
        //disable interaction if so stated in concept properties
        if(_this.colorModel.use === "indicator") return;

        _this.listColorsEl.selectAll(".vzb-cl-option").style("opacity", OPACITY_REGULAR);
        _this.minimapG.selectAll("path").style("opacity", OPACITY_REGULAR);
        _this.model.state.entities.clearHighlighted();
      },
      click: function(d, i) {
        //disable interaction if so stated in concept properties
        if(!_this.colorModel.isUserSelectable()) return;
        var view = d3.select(this);
        var target = _this.colorModel.use === "indicator"? d.paletteKey : (d[KEY]||d);

        _this.colorPicker
          .colorOld(palette[target])
          .colorDef(paletteDefault[target])
          .callback(function(value) {
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
  }

});

export default ColorLegend;
