//Population by Age
define([
    'base/tool'
], function(Tool) {

    var PopulationbyAge = Tool.extend({
        init: function(parent, options) {
            
            this.name = 'population-by-age';
            this.template = "tools/_gapminder/population-by-age/population-by-age";
            this.placeholder = options.placeholder;

            this.state = options.state;

	        //add components
            
            this.addComponent('_gapminder/population-bar-chart', {
                placeholder: '.vizabi-tool-viz'
            });
            
            this.addComponent('_gapminder/buttonlist', {
                placeholder: '.vizabi-tool-buttonlist'
            });
            
            this.addComponent('_gapminder/header', {
                placeholder: '.vizabi-tool-title'
            });
            
            this.addComponent('_gapminder/timeslider', {
                placeholder: '.vizabi-tool-timeslider'
            });

            this._super(parent, options);
        },

        //TODO: Check mapping options

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

    return PopulationbyAge;
});
