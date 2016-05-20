import * as utils from 'base/utils';
import Component from 'base/component';
import colorPicker from 'helpers/d3.colorPicker';

/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

var ColorLegend = Component.extend({

  init: function(config, context) {
    var _this = this;
    this.template = '<div class="vzb-cl-outer"></div>';
    this.name = 'colorlegend';

    this.model_expects = [{
      name: "state",
      type: "model"
    }];

    this.needsUpdate = false;
    this.which_1 = false;
    this.scaleType_1 = false;

    this.model_binds = {
      "change:state.marker.color.scaleType": function(evt, path) {
        if(!_this._readyOnce) return;
        console.log(path)
        _this.updateView();
      },
      "change:state.marker.color.which": function(evt, path) {
        if(!_this._readyOnce) return;
        console.log(path)
        _this.forwardModelUpdate();
      }
    }
    
    //contructor is the same as any component
    this._super(config, context);
  },
  
  forwardModelUpdate: function(){
    if(this.colorModel.use === "property"){
      this.model.state.entities_minimap.show["geo.cat"] = [this.colorModel.which.replace("geo.","")];
    }
  },


  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);
    this.listColorsEl = this.element
      .append("div").attr("class", "vzb-cl-holder")
      .append("div").attr("class","vzb-cl-colorlist");
    this.rainbowEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow");
    this.minimapEl = this.listColorsEl.append("div").attr("class", "vzb-cl-minimap");
    this.minimapSVG = this.minimapEl.append("svg");

    this.colorPicker = colorPicker();
    d3.select(this.root.element).call(this.colorPicker);

    this.KEY = this.model.state.entities.getDimension();
    this.colorModel = this.model.state.marker.color;
    
    console.log("CL ready once")
  },
  
  
  ready: function(){
    var _this = this;
    console.log("CL ready")
    this.model.state.marker_minimap.getFrame(this.model.state.time.value, function(frame, time) { 
      _this.frame = frame;
      _this.updateView();
    }) 
  },


  updateView: function() {
    console.log("CL update")
    var _this = this;
    var KEY = this.KEY;

    var palette = this.colorModel.getPalette();
    var canShowMap = utils.keys((this.frame||{}).geoshape||{}).length && this.colorModel.use == "property";

    var minimapKeys = this.model.state.marker_minimap.getKeys();
    
    minimapKeys.forEach(function(d){
      if (utils.keys((_this.frame||{}).geoshape||{}).indexOf(d[_this.KEY]) == -1) canShowMap = false;
    });
    
    var colorOptions = this.listColorsEl.selectAll(".vzb-cl-option");
    
    //Check if geoshape is provided
    if(!canShowMap) {
      

      if(this.colorModel.use == "indicator") {
        colorOptions = colorOptions.data(utils.keys(palette), function(d) {return d});
      }else{
        colorOptions = colorOptions.data(minimapKeys, function(d) {return d[KEY]});
      }

      colorOptions.exit().remove();
      
      //if using a discrete palette that is not supplied from concept properties but from defaults
      colorOptions.classed("vzb-cl-compact", this.colorModel.use === "property" && !(this.colorModel.getConceptprops().color||{}).palette );      

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
          .style("background-color", palette[d])
          .style("border", "1px solid " + palette[d]);
      }); 
      
      if(this.colorModel.use == "indicator") {
        
        //Calculate the hight for the rainbow gradient
        var gradientHeight;
        if(colorOptions && colorOptions[0]) {
          var firstOptionSize = colorOptions[0][0].getBoundingClientRect();
          var lastOptionSize = colorOptions[0][colorOptions[0].length - 1].getBoundingClientRect();
          gradientHeight = lastOptionSize.bottom - firstOptionSize.top;
        }
        if(!isFinite(gradientHeight)) gradientHeight = utils.keys(palette).length * 25 + 5;
        
        this.rainbowEl
          .style("height", gradientHeight + 2 + "px")
          .style("background", "linear-gradient(" + utils.values(palette).join(", ") + ")");
        
        var domain = _this.colorModel.getScale().domain();
        
        //Apply names as formatted numbers 
        colorOptions.each(function(d, index) {
          d3.select(this).select(".vzb-cl-color-legend")
            .text(_this.colorModel.getTickFormatter()(domain[index]))
        });
        
      } else {
        
        //Apply names to color legend entries if color is a property
        colorOptions.each(function(d, index) {
          d3.select(this).select(".vzb-cl-color-legend")
            .text(_this.frame.label[d[_this.KEY]]);
        });
      }
      

    }else{
      
      //Drawing a minimap from the hook data
      
      var tempdivEl = this.minimapEl.append("div").attr("class","vzb-temp");
      _this.minimapSVG.selectAll("g").remove();
      var g = _this.minimapSVG.append("g");
      minimapKeys.forEach(function(d){
        tempdivEl.html(_this.frame.geoshape[d[_this.KEY]]);
        var color = palette[d[_this.KEY]];
        g.append("path").attr("d", tempdivEl.select("svg").select("path").attr("d"))
          .style("fill", utils.isArray(color)? color[0] : color)
          .style("opacity", .8)
          .on("mouseover", _this._interact().mouseover)
          .on("mouseout", _this._interact().mouseout)
          .on("click", _this._interact().click);
        tempdivEl.html("");
      })
      var gbbox = g.node().getBBox();
      _this.minimapSVG.attr("viewBox", "0 0 " + gbbox.width*1.05 + " " + gbbox.height*1.05);
      tempdivEl.remove();
    }
      
    
    //Hide and show elements of the color legend
    //Hide color legend entries if showing minimap or if color hook is a constant
    colorOptions.classed("vzb-hidden", canShowMap || this.colorModel.which == "_default");
    //Hide rainbow element if showing minimap or if color is discrete
    //TODO: indocators-properties are incorrectly used here.
    this.rainbowEl.classed("vzb-hidden", canShowMap || this.colorModel.use !== "indicator");
    //Hide minimap if no data to draw it
    this.minimapEl.classed("vzb-hidden", !canShowMap);
  },
  
  
  _interact: function() {
    var _this = this;
    var KEY = this.KEY;
    var palette = this.colorModel.getPalette();
    var paletteDefault = this.colorModel.getDefaultPalette();

    return {
      mouseover: function(d, i) {
        //disable interaction if so stated in concept properties
        if(!_this.colorModel.isUserSelectable()) return;
        if(_this.colorModel.use === "indicator") return;
        
        var sample = d3.select(this).select(".vzb-cl-color-sample");
        sample.style("border-width", "5px");
        sample.style("background-color", "transparent");        
        
        var view = d3.select(this);
        var target = d[KEY];
        _this.minimapSVG.select("g").selectAll("path").style("opacity", .5);
        view.style("opacity", 1);

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
        if(!_this.colorModel.isUserSelectable()) return;
        if(_this.colorModel.use === "indicator") return;

        var sample = d3.select(this).select(".vzb-cl-color-sample");
        sample.style("border-width", "0px");
        sample.style("background-color", _this.colorModel.palette[d]);        
        
        _this.minimapSVG.select("g").selectAll("path").style("opacity", .8);
        _this.model.state.entities.clearHighlighted();
      },
      
      click: function(d, i) {
        //disable interaction if so stated in concept properties
        if(!_this.colorModel.isUserSelectable()) return;
        var view = d3.select(this);
        var target = _this.colorModel.use === "indicator"? d : d[KEY];

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
    this.colorPicker.resize(d3.select('.vzb-colorpicker-svg'));
  }

});

export default ColorLegend;
