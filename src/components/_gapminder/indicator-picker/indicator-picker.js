//IndicatorPicker
define([
    'd3',
    'base/component'
], function(d3, Component) {
    
    var INDICATOR = "value";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";
    
    var availOpts = {
        'geo.region':   {use: 'property',   unit: '', scales: ['ordinal']       },
        'geo':          {use: 'property',   unit: '', scales: ['ordinal']       },
        'time':         {use: 'indicator',  unit: 'year', scales: ['time']          },
        'lex':          {use: 'indicator',  unit: 'years', scales: ['linear'] },
        'gdp_per_cap':  {use: 'indicator',  unit: '$/year/person', scales: ['log', 'linear'] },
        'pop':          {use: 'indicator',  unit: '', scales: ['linear', 'log'] },
        '_default':     {use: 'value',      unit: '', scales: ['linear', 'log'] }
    };
    
    

    var IndicatorPicker = Component.extend({

        /**
         * Initializes the Indicator Picker.
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

            var pointer = "_default";
            
            var data = {};
            data[INDICATOR] = Object.keys(availOpts);
            
            if(data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];
            
            data[SCALETYPE] = availOpts[pointer].scales;
            
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
                .attr("value", function(d){return d});
            elOptionsScaletype.enter().append("option")
                .attr("value", function(d){return d});
            
            //show translated UI string
            elOptionsIndicator.text(function(d){ return _this.translator("indicator/" + d) })
            elOptionsScaletype.text(function(d){ return _this.translator("scaletype/" + d) })
            
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
                mdl.unit = availOpts[value].unit;
                
                if(availOpts[value].scales.indexOf(mdl.scaleType) == -1){
                    mdl.scaleType = availOpts[value].scales[0];
                }
            }
        },
        
    });

    return IndicatorPicker;

});