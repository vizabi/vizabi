//ColorLegend
define([
    'd3',
    'base/component'
], function(d3, Component) {

    var INDICATOR = "value";
    
    

    var availOpts = {
        'geo.region':   {'_default': '#ffb600', 'world': "#ffb600", 'asi':'#FF5872', 'eur':'#FFE700', 'ame':'#7FEB00', 'afr':'#00D5E9'},
        'geo':          {'color1':'#F77481', 'color2':'#E1CE00', 'color3':'#B4DE79', 'color4':'#62CCE3'},
        'time':         ['#F77481', '#E1CE00', '#B4DE79'],
        'lex':          ['#F77481', '#E1CE00', '#B4DE79'],
        'gdp_per_cap':  ['#F77481', '#E1CE00', '#B4DE79', '#62CCE3'],
        'pop':          ['#F77481', '#E1CE00', '#B4DE79'],
        '42':           '#fa5ed6'
    };
    

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
            
            this.listColors = this.element.append("div").attr("class", "vzb-cl-colorList");
            
            var nHues = 20;
            var nLightness = 6;
            var minRadius = 15;
            var minLightness = 50;
            var minHue = 15;
            var saturation = "70%";
            colorData = [];
            for(var j = 0; j<nLightness; j++) {
                var lightness = (minLightness+(100-minLightness)/nLightness * j) + "%";

                colorData.push([]);
                for(var i = 0; i<=nHues; i++) {
                    var hue = minHue+(364-minHue)/nHues * i;
                    colorData[j].push("hsl(" + hue + "," + saturation + "," + lightness +  ")");
                }
            }

            this.pickerCanvas = this.element.append("svg")
                .attr("class", "vzb-cl-colorPicker vzb-invisible");
            
            var width = parseInt(this.pickerCanvas.style("width"));
            var height = parseInt(this.pickerCanvas.style("height"));
            var radius = width/2*0.8;

            
            this.pickerCanvas.append("rect")
                .attr("width", width)
                .attr("height", height)
                .on("mousemove", function(){
                    _this.chosenColor = _this.currentColor;
                    _this.colorSample.style("fill", _this.chosenColor);
                })
                .on("mouseout", function(){
                })
                .on("click", function(){
                    _this.pickerCanvas.classed("vzb-invisible", true);
                    _this.listColors.classed("vzb-invisible", false);
                });
            
            this.pickerCanvas.append("rect")
                .attr("class", "vzb-cl-colorSample")
                .attr("width", width/2)
                .attr("height", 10);
            this.colorSample = this.pickerCanvas.append("rect")
                .attr("class", "vzb-cl-colorSample")
                .attr("width", width/2)
                .attr("x", width/2)
                .attr("height", 10);
            
            var arc = d3.svg.arc();

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return 1 });
            
            this.pickerCanvas.selectAll(".circle")
                .data(colorData)
                .enter().append("g")
                .attr("class", "circle")
                .attr("transform", "translate("+(radius + width*0.1) +","+(radius + width*0.1) +")")
                .each(function(circleData, index){
                    
                    arc.outerRadius(minRadius+(radius-minRadius)/nLightness*(nLightness-index))
                        .innerRadius(minRadius+(radius-minRadius)/nLightness*(nLightness-index-1));
                    
                    var segment = d3.select(this).selectAll(".segment")
                        .data(pie(circleData))
                        .enter().append("g")
                        .attr("class", "segment");
                
                    segment.append("path")
                        .attr("d", arc)
                        .style("fill", function(d) {return d.data })
                        .on("mousemove", function(){
                            d3.select(this).style("stroke", "white");
                            _this.chosenColor = d3.select(this).style("fill");
                            _this.colorSample.style("fill", _this.chosenColor);
                            _this._setModel(_this.chosenColor);
                        })
                        .on("mouseout", function(){
                            d3.select(this).style("stroke", "none");
                        })
                        .on("click", function(){
                            d3.select(this).style("stroke", "none");
                            _this.pickerCanvas.classed("vzb-invisible", true);
                            _this.listColors.classed("vzb-invisible", false);
                            
                        });
                })
                
            
        },
        
        updateView: function(){
            var _this = this;
            this.translator = this.model.language.getTFunction();
            var indicator = this.model.color[INDICATOR];
            var data = Object.keys(availOpts[indicator]);

            var el_colors = this.listColors
                .selectAll(".vzb-cl-option")
                .data(data, function(d){return d});

            el_colors.exit().remove();
            
            el_colors.enter().append("div").attr("class", "vzb-cl-option")
                .each(function(d){
                    d3.select(this).append("div")
                        .attr("class", "vzb-cl-color-sample")
                        .style("background-color",availOpts[indicator][d])
                        .style("border", "1px solid " + availOpts[indicator][d]);
                
                    d3.select(this).append("div")
                        .attr("class", "vzb-cl-color-legend")
                        .text(d);
                })
                .on("mousemove", function(d){
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "5px");
                    sample.style("background-color", "transparent");

                })
                .on("mouseout", function(d){
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "0px");
                    sample.style("background-color", availOpts[indicator][d]);
                })
                .on("click", function(d){
                    _this.pickerCanvas.classed("vzb-invisible", false);
                    _this.listColors.classed("vzb-invisible", true);
                    _this.currentColor = availOpts[indicator][d];
                    _this.pickerCanvas.selectAll(".vzb-cl-colorSample")
                        .style("fill", _this.currentColor);
                    _this.target = {indicator: indicator, segment: d};
                });
        },
        
        
        
        _setModel: function (value) {
            var _this = this;
            availOpts[_this.target.indicator][_this.target.segment] = value;
            
            this.model.color.domain = availOpts[_this.target.indicator];
        }
        

    });

    return ColorLegend ;

});