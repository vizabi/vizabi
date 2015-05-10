//ColorLegend
define([
    'd3',
    'base/component'
], function(d3, Component) {

    var INDICATOR = "value";
    
    

    var availOpts = {
        'geo.region':   {'asi':'#FF5872', 'eur':'#FFE700', 'ame':'#7FEB00', 'afr':'#00D5E9', '_default': '#ffb600'},
        'geo':          {'color1':'#F77481', 'color2':'#E1CE00', 'color3':'#B4DE79', 'color4':'#62CCE3'},
        'time':         ['#F77481', '#E1CE00', '#B4DE79'],
        'lex':          ['#F77481', '#E1CE00', '#B4DE79'],
        'gdp_per_cap':  ['#F77481', '#E1CE00', '#B4DE79', '#62CCE3'],
        'pop':          ['#F77481', '#E1CE00', '#B4DE79'],
        '42':           ['#fa5ed6']
    };
    
    
    function _hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return "#" + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(16);
    }
    
    

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
            
            var nHues = 15;
            var nLightness = 4;
            var minRadius = 15;
            var minLightness = 0.50;
            var lightnessAt0_display = 0.40;
            var lightnessAt0_actual = 0.30;
            var saturationAt0 = 0.0;
            var minHue = 0;
            var saturation = 0.7;
            colorData = [];
            for(var j = 0; j<nLightness; j++) {
                var lightness = (minLightness+(1-minLightness)/nLightness * j);

                colorData.push([]);
                for(var i = 0; i<=nHues; i++) {
                    var hue = minHue+(1-minHue)/nHues * i;
                    colorData[j].push({
                        display: _hslToRgb(hue, i==0?saturationAt0:saturation, j==0?lightnessAt0_display:lightness),
                        actual: _hslToRgb(hue, i==0?saturationAt0:saturation, j==0?lightnessAt0_actual:lightness)
                    });
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
                .attr("class", "vzb-cl-colorCell")
                .on("mouseover", function(d){_this._cellHover(_this.currentColor)});
            
            
            this.pickerCanvas.append("text")
                .attr("x", width*0.1)
                .attr("y", 15)
                .style("text-anchor", "start")
                .attr("class", "vzb-cl-colorSampleText");
                
            this.colorSampleText = this.pickerCanvas.append("text")
                .attr("x", width*0.9)
                .attr("y", 15)
                .style("text-anchor", "end")
                .attr("class", "vzb-cl-colorSampleText");
            
            var defaultColorR = 15;
            this.pickerCanvas.append("circle")
                .attr("class", "vzb-cl-defaultColor vzb-cl-colorCell")
                .attr("r", defaultColorR)
                .attr("cx", defaultColorR+width*0.1)
                .attr("cy", height-defaultColorR-width*0.05)
                .on("mouseover", function(d){_this._cellHover(_this.defaultColor)});
            
            this.pickerCanvas.append("text")
                .attr("x", width*0.1)
                .attr("y", height-width*0.05)
                .attr("dy", "0.3em")
                .text("default");
            
            
            this.circles = this.pickerCanvas.append("g")
                .attr("transform", "translate("+(radius + width*0.1) +","+(radius + width*0.1) +")");
            
            this.circles.append("circle")
                .attr("r", minRadius-2)
                .attr("fill", "#FFF")
                .attr("class", "vzb-cl-colorCell")
                .on("mouseover", function(d){_this._cellHover("#FFF")})
            
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
            
            this.circles.selectAll(".circle")
                .data(colorData)
                .enter().append("g")
                .attr("class", "circle")
                .each(function(circleData, index){
                    
                    arc.outerRadius(minRadius+(radius-minRadius)/nLightness*(nLightness-index))
                        .innerRadius(minRadius+(radius-minRadius)/nLightness*(nLightness-index-1));

                
                    var segment = d3.select(this).selectAll(".segment")
                        .data(pie(circleData))
                        .enter().append("g")
                        .attr("class", "segment");
                
                    segment.append("path")
                        .attr("class", "vzb-cl-colorCell")
                        .attr("d", arc)
                        .style("fill", function(d) {return d.data.display })
                        .style("stroke", function(d) {return d.data.display })
                        .on("mouseover", function(d){_this._cellHover(d.data.actual, this, true)})
                        .on("mouseout", function(d){_this._cellUnHover()});
                })
            
            this.colorPointer = this.circles.append("path")
                .attr("class", "vzb-cl-colorPointer vzb-invisible");
          
            
            
            this.pickerCanvas.selectAll(".vzb-cl-colorCell")
                .on("click", function(){_this._toggleColorPicker()});
            
        },
        
        
        
        _cellHover: function(value, view, useColorPointer){
            var _this = this;
            if(useColorPointer){
                this.colorPointer.classed("vzb-invisible", false)
                    .attr("d", d3.select(view).attr("d"));
            }
            _this.chosenColor = value;
            _this.colorSample.style("fill", _this.chosenColor);
            _this.colorSampleText.text(_this.chosenColor);
            _this._setModel(_this.chosenColor);
        },        
        _cellUnHover: function(){
            this.colorPointer.classed("vzb-invisible", true);
        },
        _toggleColorPicker: function(){
            this.colorPickerIsOn = !this.colorPickerIsOn;
            this.pickerCanvas.classed("vzb-invisible", !this.colorPickerIsOn);
        },
        
        updateView: function(){
            var _this = this;
            this.translator = this.model.language.getTFunction();
            var indicator = this.model.color[INDICATOR];
            var domain = this.model.color.domain;
            var data = Object.keys(availOpts[indicator]);

            var el_colors = this.listColors
                .selectAll(".vzb-cl-option")
                .data(data, function(d){return d});

            el_colors.exit().remove();
            
            el_colors.enter().append("div").attr("class", "vzb-cl-option")
                .each(function(d){
                    d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
                    d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
                })
                .on("mousemove", function(d){
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "5px");
                    sample.style("background-color", "transparent");

                })
                .on("mouseout", function(d){
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "0px");
                    sample.style("background-color", domain[d]);
                })
                .on("click", function(d){
                    _this._toggleColorPicker();
                    _this.currentColor = domain[d];
                    _this.pickerCanvas.selectAll(".vzb-cl-colorSample")
                        .style("fill", _this.currentColor);
                    _this.pickerCanvas.selectAll(".vzb-cl-colorSampleText")
                        .text(_this.currentColor);
                    _this.pickerCanvas.selectAll(".vzb-cl-defaultColor")
                        .style("fill", availOpts[indicator][d]);
                    _this.defaultColor = availOpts[indicator][d];
                    _this.target = {indicator: indicator, segment: d};
                })
            
            
            el_colors.each(function(d){
                d3.select(this).select(".vzb-cl-color-sample")
                    .style("background-color",domain[d])
                    .style("border", "1px solid " + domain[d]);

                d3.select(this).select(".vzb-cl-color-legend")
                    .text(_this.translator("region/" + d));
            });
        },
        
        
        
        _setModel: function (value) {
            var _this = this;
            var domain = _.clone(availOpts[this.target.indicator]);
            for(segment in domain){
                domain[segment] = this.model.color.domain[segment];
            }
            domain[_this.target.segment] = value;
            
            this.model.color.domain = domain;
        }
        

    });

    return ColorLegend ;

});