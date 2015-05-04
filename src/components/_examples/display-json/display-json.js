//Show Json
define([
    'd3',
    'base/component'
], function(d3, Component) {

    var ShowJson = Component.extend({

        /**
         * Initializes the component (Show Json).
         * Executed once before any template is rendered.
         * @param {Object} config The options passed to the component
         * @param {Object} context The component's parent
         */
        init: function(config, context) {
            this.template = "components/_examples/display-json/display-json";

            //determine which models this component expects
            //Example:
            this.model_expects = [{
                name: "data",
                type: "data"
            }];

            var _this = this;

            //specifying subcomponents
            this.components = [];

            //contructor is the same as any component
            this._super(config, context);

        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as d3 objects
         */
        domReady: function() {
        },

        /**
         * Executes everytime there's an update event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        modelReady: function() {
            var profits = this.model.data.profits;

            this.element.html('');
            this.element.selectAll('.profit-year')
                .data(profits)
                .enter()
                .append('p')
                .attr('class', 'profit-year')
                .html(function(d) {
                    return "Year: "+d.year+" - Profit: "+d.profit;
                });
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            //E.g: var height = this.placeholder.style('height');
        }


    });

    return ShowJson ;

});