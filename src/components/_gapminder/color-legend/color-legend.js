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

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        domReady: function() {
        },
        
        updateView: function(){
            this.translator = this.model.language.getTFunction();
            var indicator = this.model.color[INDICATOR];
            var data = Object.keys(availOpts[indicator]);

            var el_colors = this.element
                .selectAll(".vzb-cl-option")
                .data(data, function(d){return d});

            el_colors.exit().remove();
            
            el_colors.enter().append("div").attr("class", "vzb-cl-option")
                .each(function(d){
                    d3.select(this).append("div")
                        .attr("class", "vzb-cl-color-sample")
                        .style("background-color",availOpts[indicator][d]);
                
                    d3.select(this).append("div")
                        .attr("class", "vzb-cl-color-legend")
                        .text(d);
                });

        },
        
        
        
        _setModel: function (what, value) {
            this.model.color.domain = this.domain;
        }
        

    });

    return ColorLegend ;

});