define([
    'underscore',
    'base/tool'
], function(_, Tool) {

    var lineChart = Tool.extend({
        init: function(parent, options) {
            
            this.name = 'line-chart';
            this.template = "tools/line-chart/line-chart";
            this.placeholder = options.placeholder;

            this.state = options.state;

            //add components
            this.addComponent('header', {
                placeholder: '.vizabi-tool-title'
            });
            this.addComponent('line-chart', {
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
