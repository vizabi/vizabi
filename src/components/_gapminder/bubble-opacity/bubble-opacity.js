//BubbleOpacity
define([
    'd3',
    'base/component'
], function(d3, Component) {

    var indicator, min = 1, max = 100;

    var BubbleOpacity = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = "components/_gapminder/bubble-opacity/bubble-opacity";

            this.model_expects = [{
                name: "entities",
                type: "entities"
            }];
            
            var _this = this;
            
            this.model_binds = {
                "change:entities:select": function(evt) {
                    _this.updateView();
                },
                "change:entities:opacityNonSelected": function(evt) {
                    _this.updateView();
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
            this.slider = this.element.selectAll('#vzb-bo-slider');

            this.slider
                .attr('min', 0)
                .attr('max', 1)
                .attr('step', 0.1)
                .on('input', function() {
                    _this._setModel();
                });
            
            this.updateView();
        },

        updateView: function () {
            var someSelected = this.model.entities.select.length;
            var value = this.model.entities.opacityNonSelected;
            
            this.slider
                .attr('value', value)
                .attr('disabled', someSelected?null:true);
            this.element.classed('vzb-disabled', someSelected?false:true);
        },
        
        _setModel: function () {
            this.model.entities.opacityNonSelected = +d3.event.target.value;
        }
    });

    return BubbleOpacity;

});