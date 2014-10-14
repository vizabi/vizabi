define([
    'base/tool'
], function(Tool) {

    var lineChart = Tool.extend({
        init: function(parent, options) {
            
            this.name = 'line-chart';
            this.template = "tools/_gapminder/line-chart/line-chart";
            this.placeholder = options.placeholder;

            this.state = options.state;

            //add components
            this.addComponent('_gapminder/header', {
                placeholder: '.vizabi-tool-title'
            });
            this.addComponent('_gapminder/line-chart', {
                placeholder: '.vizabi-tool-viz'
            });
            this.addComponent('_gapminder/timeslider', {
                placeholder: '.vizabi-tool-timeslider'
            });
            this.addComponent('_gapminder/buttonlist', {
                placeholder: '.vizabi-tool-buttonlist',
                buttons: [{
                            id: "geo",
                            title: "Country",
                            icon: "globe",

                        }],
                data: options.data
            });

            this._super(parent, options);
        },

        getQuery: function() {
            //build query with state info
            var query = [{
                    select: [
                        'geo',
                        'time',
                        'geo.name',
                        'geo.category', 
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



    //statePropertyMapping: {time:}

    //constructDataQueryFromState(){}

    return lineChart;
});
