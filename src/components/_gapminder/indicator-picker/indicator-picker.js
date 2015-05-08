//BubbleAxes
define([
    'd3',
    'base/component'
], function(d3, Component) {
    
    var INDICATOR = "value";
    var SCALETYPE = "scale";
    var MODELTYPE_COLOR = "color";
    
    var availOpts = {
        'geo.region':   {use: 'property',   scales: ['ordinal']       },
        'geo':          {use: 'property',   scales: ['ordinal']       },
        'time':         {use: 'indicator',  scales: ['time']          },
        'lex':          {use: 'indicator',  scales: ['linear'] },
        'gdp_per_cap':  {use: 'indicator',  scales: ['linear', 'log'] },
        'pop':          {use: 'indicator',  scales: ['linear', 'log'] },
        '42':           {use: 'value',      scales: ['linear', 'log'] }
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
                name: "axis"
                //TODO: learn how to expect model "axis" or "size" or "color"
            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "change:axis": function(evt) {
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
            
            
            this.ui = _.extend({
                selectIndicator: true, 
                selectScaletype: true
            }, this.ui);

        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        domReady: function() {
            var _this = this;
            
            this.el_select_indicator = this.element.select('.vzb-ip-indicator');
            this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');
            
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
        updateView: function() {
            var _this = this;
            this.translator = this.model.language.getTFunction();

            var data = {};
            data[INDICATOR] = Object.keys(availOpts);
            data[SCALETYPE] = availOpts[this.model.axis[INDICATOR]].scales;
            
            //bind the data to the selector lists
            var elOptionsIndicator = this.el_select_indicator.selectAll("option")
                .data(data[INDICATOR], function(d){return d});
            var elOptionsScaletype = this.el_select_scaletype.selectAll("option")
                .data(data[SCALETYPE], function(d){return d});
            
            //remove irrelevant options
            elOptionsIndicator.exit().remove();
            elOptionsScaletype.exit().remove();
            
            //populate options into the list
            elOptionsIndicator.enter().append("option")
                .text(function(d){ return _this.translator("indicator/" + d) })
                .attr("value", function(d){return d});
            elOptionsScaletype.enter().append("option")
                .text(function(d){ return _this.translator("scaletype/" + d) })
                .attr("value", function(d){return d});
            
            //set the selected option
            this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
            this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];
            
            //disable the selector in case if there is only one option, hide if so requested by the UI setings
            this.el_select_indicator
                .style('display', this.ui.selectIndicator?"auto":"none")
                .attr('disabled', data[INDICATOR].length<=1?"true":null)
            this.el_select_scaletype
                .style('display', this.ui.selectScaletype?"auto":"none")
                .attr('disabled', data[SCALETYPE].length<=1?"true":null)
        },
        



        

        _setModel: function (what, value) {
            var mdl = this.model.axis;
            mdl[what] = value;
            
            if(what==INDICATOR){
                mdl.use = availOpts[value].use;
                
                if(availOpts[value].scales.indexOf(mdl.scale) == -1){
                    mdl.scale = availOpts[value].scales[0];
                }
            }
        },
        
    });

    return BubbleAxes;

});