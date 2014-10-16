//Population by Age
define([
    'base/tool'
], function(Tool) {

    var $currentYear,
        $selectedGroupBirthYear;

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
                placeholder: '.vizabi-tool-buttonlist',
                buttons: [{
                    id: "geo",
                    title: "Country",
                    icon: "globe",

                }],
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
                    'age_group',
                    'geo.name',
                    this.model.getState("indicator")
                ],
                where: {
                    geo: this.model.getState("show").geo,
                    'geo.category': this.model.getState("show")['geo.category'],
                    time: this.model.getState("timeRange")
                }
            }];

            return query;
        },

        postRender: function() {
            $currentYear = this.element.select('.current-year span');
            $selectedGroupBirthYear = this.element.select('.selected-group-birth-year span');
            this.updateYears();
        },

        update: function() {
            this.updateYears();
            this._super();
        },

        updateYears: function() {
            $currentYear.text(this.model.getState('time'));
            $selectedGroupBirthYear.text(this.model.getState('selectedGroupBirthYear'));
        }
    });

    return PopulationbyAge;
});
