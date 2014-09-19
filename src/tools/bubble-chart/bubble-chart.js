define([
    'underscore',
    'base/tool'
], function(_, Tool) {

    var bubbleChart = Tool.extend({
        init: function(parent, options) {

            this.name = 'bubble-chart';
            this.template = "tools/bubble-chart/bubble-chart";
            this.placeholder = options.placeholder;

            this.state = options.state;

            //add components
            this.addComponent('header', {
                placeholder: '.vizabi-tool-title'
            });
            this.addComponent('bubble-chart', {
                placeholder: '.vizabi-tool-viz'
            });
            this.addComponent('timeslider2', {
                placeholder: '.vizabi-tool-timeslider'
            });
            this.addComponent('buttonlist', {
                placeholder: '.vizabi-tool-buttonlist',
                buttons: [{
                    id: "geo",
                    title: "Country",
                    icon: "globe"
                }],
                data: options.data
            });

            this._super(parent, options);

        },

        //TODO: this could be moved to the tool if we find a
        //common state pattern
        getQuery: function() {
            //build query with state info

            var query = [{
                from: 'data',
                select: _.union(['geo', 'geo.name', 'time'],this.model.getState("indicator")),
                where: {
                    geo: this.model.getState("show").geo,
                    'geo.category': this.model.getState("show")['geo.category'], 
                    time: this.model.getState("timeRange")
                }
            }];

            return query;
        }
    });

    return bubbleChart;
});