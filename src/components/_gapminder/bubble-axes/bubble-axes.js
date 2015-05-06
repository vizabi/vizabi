//BubbleAxes
define([
    'd3',
    'base/component'
], function(d3, Component) {
    
    var INDICATOR = "value";
    var SCALETYPE = "scale";
    var X = "x";
    var Y = "y";
    var availOpts = {
        'geo.region':   {use: 'property',   scales: ['ordinal']},
        'geo':          {use: 'property',   scales: ['ordinal']},
        'time':         {use: 'indicator',  scales: ['time']},
        'geo.category': {use: 'property',   scales: ['ordinal']},
        'lex':          {use: 'indicator',  scales: ['linear', 'log']},
        'gdp_per_cap':  {use: 'indicator',  scales: ['linear', 'log', 'genericLog']},
        'pop':          {use: 'indicator',  scales: ['linear', 'log']},
        '42':           {use: 'value',      scales: ['linear', 'log']},
    };
    var availX = ['geo.region', 'geo', 'time', 'geo.category', 'lex', 'gdp_per_cap' , 'pop'];
    var availY = ['geo.region', 'geo', 'geo.category', 'lex', 'gdp_per_cap' , 'pop', '42'];
    

    var BubbleAxes = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = "components/_gapminder/bubble-axes/bubble-axes";
            var _this = this;

            this.model_expects = [{
                name: "marker",
                type: "model"
            },{
//                name: "time",
//                type: "time"
//            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "change:marker:axis_x": function(evt) {
                    _this.updateOptions();
                },
                "change:marker:axis_y": function(evt) {
                    _this.updateOptions();
                },
                "change:time:adaptMinMaxZoom": function(evt) {
                    _this.updateOptions();
                },
                "readyOnce": function(evt) {
                    _this.updateOptions();
                },
                "change:language": function(evt) {
                    _this.updateOptions();
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
            var _this = this;
            
            this.el_xaxis_container = this.element.select('.vzb-ba-xaxis');
            this.el_yaxis_container = this.element.select('.vzb-ba-yaxis');
            
            var _buildSelector = function(what, which){
                _this["el_" + which + "axis_" + what] = _this["el_" + which + "axis_container"]
                    .append("select")
                    .on("change", function(){ _this._setModel(what,which,this.value) });
            }
            
            _buildSelector(INDICATOR, X);
            _buildSelector(SCALETYPE, X);
            _buildSelector(INDICATOR, Y);
            _buildSelector(SCALETYPE, Y);
        },


        /**
         * Executes everytime there's a data event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        updateOptions: function() {
            this.translator = this.model.language.getTFunction();

            var data = {
                x: {value: availX,
                    scale: availOpts[this.model.marker.axis_x.value].scales
                }, 
                y: {value: availY, 
                    scale: availOpts[this.model.marker.axis_y.value].scales
                }
            } 
                        
            this._buildOptionList(INDICATOR, X, data);
            this._buildOptionList(SCALETYPE, X, data);
            this._buildOptionList(INDICATOR, Y, data);
            this._buildOptionList(SCALETYPE, Y, data);
            
        },
        
        
        
  
        
        
        
        _buildOptionList: function(what, which, data){
            var _this = this;
            
            var select = _this["el_" + which + "axis_" + what];
            
            var options = select
                .selectAll("option")
                .data(data[which][what]);
            
            var languagePrefix = what==INDICATOR? "indicator/":"scaletype/";

            options.exit().remove();
            options.enter().append("option");
            options
                .text(function(d){
                    return _this.translator(languagePrefix + d);
                })
                .attr("value", function(d){return d});

            select[0][0].value = _this.model.marker["axis_" + which][what];
            
            select.attr('disabled', data[which][what].length==1?"true":null);
            
        },
        
        

        _setModel: function (what, which, value) {
            var model = this.model.marker["axis_" + which];
            model[what] = value;
            
            if(what==INDICATOR){
                model.use = availOpts[value].use;
                if(availOpts[value].scales.indexOf(model.scale) == -1){
                    model.scale = availOpts[value].scales[0];
                }
                    
            }
            
        },
        
    });

    return BubbleAxes ;

});