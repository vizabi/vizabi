define([
    'base/tool'
], function(Tool) {

    var mountainChart = Tool.extend({
        init: function(parent, options) {

            this.name = 'mountain-chart';
            this.template = "tools/_examples/mountain-chart/mountain-chart";
            this.placeholder = options.placeholder;

            this.state = options.state;

            //add components
            this.addComponent('_gapminder/header', {
                placeholder: '.vzb-tool-title'
            });
            this.addComponent('_examples/mountain-chart', {
                placeholder: '.vzb-tool-viz'
            });
            this.addComponent('_gapminder/timeslider', {
                placeholder: '.vzb-tool-timeslider'
            });
            this.addComponent('_gapminder/buttonlist', {
                placeholder: '.vzb-tool-buttonlist',
                buttons: [{
                    id: "geo",
                    title: "Country",
                    icon: "globe"
                }],
                data: options.data
            });

            this._super(parent, options);

        },


        getQuery: function() {
            //build query with state info

            var query = [{
                from: 'data',
                select: _.union(['geo', 'geo.name', 'time', 'geo.region'],this.model.getState("indicator")),
                where: {
                    geo: this.model.getState("show").geo,
                    'geo.category': this.model.getState("show")['geo.category'],
                    time: this.model.getState("timeRange")
                }
            }];

            return query;
        }
    });

    return mountainChart;
});
