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
    

    var BubbleAxes = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = "components/_gapminder/indicator-picker/indicator-picker";
            var _this = this;

            this.model_expects = [{
                name: "axis",
                type: "axis"
            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "change:axis": function(evt) {
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
            
            this.el_select_indicator = this.element.select('.indicator');
            this.el_select_scaletype = this.element.select('.scaletype');
            
            this.el_select_indicator
                .on("change", function(){ _this._setModel(INDICATOR,this.value) });
            
            this.el_select_scaletype
                .on("change", function(){ _this._setModel(SCALETYPE,this.value) });
            
        },


        /**
         * Executes everytime there's a data event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        updateOptions: function() {
            var _this = this;
            this.translator = this.model.language.getTFunction();

            var data = {};
            data[INDICATOR] = Object.keys(availOpts);
            data[SCALETYPE] = availOpts[this.model.axis[INDICATOR]].scales;
            
            var elOptionsIndicator = this.el_select_indicator
                .selectAll("option")
                .data(data[INDICATOR]);
            
            var elOptionsScaletype = this.el_select_scaletype
                .selectAll("option")
                .data(data[SCALETYPE]);
            
            elOptionsIndicator.exit().remove();
            elOptionsScaletype.exit().remove();
            
            elOptionsIndicator.enter().append("option");
            elOptionsScaletype.enter().append("option");
            
            elOptionsIndicator
                .text(function(d){ return _this.translator("indicator/" + d) })
                .attr("value", function(d){return d});
            elOptionsScaletype
                .text(function(d){ return _this.translator("scaletype/" + d) })
                .attr("value", function(d){return d});
            
            elOptionsIndicator[0][0].value = this.model.axis[INDICATOR];
            elOptionsScaletype[0][0].value = this.model.axis[SCALETYPE];
            
            elOptionsIndicator.attr('disabled', data[INDICATOR].length==1?"true":null);
            elOptionsScaletype.attr('disabled', data[SCALETYPE].length==1?"true":null);
        },
        


            
            
        
        
        

        _setModel: function (what, value) {
            this.model.axis[what] = value;
            
            if(what==INDICATOR){
                this.model.axis.use = availOpts[value].use;
                
                if(availOpts[value].scales.indexOf(this.model.axis.scale) == -1){
                    this.model.axis.scale = availOpts[value].scales[0];
                }    
            }
        },
        
    });

    return BubbleAxes ;

});