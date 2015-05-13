//ColorLegend
define([
    'd3',
    'base/component',
    'd3colorPicker',
], function(d3, Component) {

    var INDICATOR = "value";
    
    
    var ColorLegend = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            var _this = this;
            this.template = "components/_gapminder/color-legend/color-legend";
            
            this.model_expects = [{
                name: "color",
                type: "color"
            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "change:color": function(evt) {
                    _this.updateView();
                },
                "readyOnce": function(evt) {
                    _this.updateView();
                },
                "change:language": function(evt) {
                    _this.updateView();
                },
                "ready": function(evt) {
                }   
            }
            
            //contructor is the same as any component
            this._super(config, context);
        },


        domReady: function() {

            
            var _this = this;
            
            this.listColorsEl = this.element.append("div").attr("class", "vzb-cl-colorList");
            
            
            this.colorPicker = d3.svg.colorPicker();
            
            this.element
                .call(this.colorPicker);
        },
        

        
        updateView: function(){
            var _this = this;
            this.translator = this.model.language.getTFunction();

            var palette = this.model.color.palette;
            
            
            var whichPalette = "_default";
            if(Object.keys(this.model.color.getAvailOpts()).indexOf(this.model.color[INDICATOR]) > -1) {
                whichPalette = this.model.color[INDICATOR];
            }
            
            var paletteDefault = this.model.color.getAvailOpts()[whichPalette];
            

            var colors = this.listColorsEl
                .selectAll(".vzb-cl-option")
                .data(_.keys(paletteDefault), function(d){return d});

            colors.exit().remove();
            
            colors.enter().append("div").attr("class", "vzb-cl-option")
                .each(function(){
                    d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
                    d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
                })
                .on("mouseover", function(){
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "5px");
                    sample.style("background-color", "transparent");

                })
                .on("mouseout", function(d){
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "0px");
                    sample.style("background-color", palette[d]);
                })
                .on("click", function(d){
                    _this.colorPicker
                        .colorOld(palette[d])
                        .colorDef(paletteDefault[d])
                        .callback(function(value){_this.model.color.setColor(value, d)})
                        .show(true);
                })
            
            
            colors.each(function(d){
                d3.select(this).select(".vzb-cl-color-sample")
                    .style("background-color", palette[d])
                    .style("border", "1px solid " + palette[d]);

                d3.select(this).select(".vzb-cl-color-legend")
                    .text(_this.translator("color/" + _this.model.color.value + "/" + d));
            });
        }
        

    });

    return ColorLegend ;

});