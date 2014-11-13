//BubbleSize
define([
    'd3',
    'base/component'
], function(d3, Component) {

    var indicator, min = 1, max = 100;

    var BubbleSize = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = "components/_gapminder/bubble-size/bubble-size";

            //specifying subcomponents
            this.components = [];

            //contructor is the same as any component
            this._super(config, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        postRender: function() {
            var value = this.model.size;
            indicator = this.element.select('#vzb-bs-indicator');
            slider = this.element.selectAll('#vzb-bs-slider');

            slider
                .attr('min', min)
                .attr('max', max)
                .attr('value', value)
                .on('input', this.slideHandler.bind(this));
        },

        /**
         * Executes everytime there's an update event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        update: function() {
            indicator.text(this.model.size);
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            //E.g: var height = this.placeholder.style('height');
        },

        slideHandler: function () {
            this.model.size = +d3.event.target.value;
        }
    });

    return BubbleSize ;

});