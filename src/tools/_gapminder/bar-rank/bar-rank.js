define([
    'base/tool'
], function(Tool) {

    var barRank = Tool.extend({
        init: function(parent, options) {

            this.name = 'bar-rank';
            this.template = "tools/_gapminder/bar-rank/bar-rank";
            this.placeholder = options.placeholder;

            this.state = options.state;

            //add components
            this.addComponent('_gapminder/header', {
                placeholder: '.vizabi-tool-title'
            });
            this.addComponent('_gapminder/bar-rank', {
                placeholder: '.vizabi-tool-viz'
            });
            this.addComponent('_gapminder/filter', {
                placeholder: '.vizabi-tool-filter'
            });
            this.addComponent('_gapminder/info-box', {
                placeholder: '.vizabi-tool-info-box'
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

        //build query from state
        getQuery: function() {
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

    return barRank;
});
