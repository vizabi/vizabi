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

            //contructor is the same as any component
            this._super(config, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        domReady: function() {
            var value = this.model.entities.opacityNonSelected, _this = this;
            indicator = this.element.select('#vzb-bo-indicator');
            slider = this.element.selectAll('#vzb-bo-slider');

            slider
                .attr('min', 0)
                .attr('max', 1)
                .attr('step', 0.1)
                .attr('value', value)
                .on('input', function() {
                    _this.slideHandler();
                });
        },

        /**
         * Executes everytime there's a data event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        modelReady: function() {
            indicator.text(this.model.entities.opacityNonSelected);
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            //E.g: var height = this.placeholder.style('height');
        },

        slideHandler: function () {
            this.model.entities.opacityNonSelected = +d3.event.target.value;
        }
    });

    return BubbleOpacity;

});