define([
    'underscore',
    'base/tool'
], function(_, Tool) {

    var lineChart = Tool.extend({
        init: function(parent, options) {
            
            this.name = 'pop-slider';
            this.template = "tools/_examples/pop-slider/pop-slider";
            this.placeholder = options.placeholder;

            this.state = options.state;

            this.addComponent('_examples/year-display', {
                placeholder: '.vizabi-tool-year'
            });

            this.addComponent('_examples/indicator-display', {
                placeholder: '.vizabi-tool-display'
            });

            this.addComponent('_gapminder/timeslider', {
                placeholder: '.vizabi-tool-timeslider'
            });

            this._super(parent, options);
        },

        getQuery: function() {
            var query = [{
                    select: [
                        'geo',
                        'time',
                        'geo.name',
                        this.model.getState("indicator")
                    ],
                    where: {
                        geo: this.model.getState("show").geo,
                        'geo.category': this.model.getState("show")['geo.category'],
                        time: this.model.getState("timeRange")
                    }}];

            return query;
        }
    });


    return lineChart;
});
