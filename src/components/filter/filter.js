define([
    'jquery',
    'd3',
    'base/component',
    'jqueryui_autocomplete'
], function($, d3, Component) {

    var $filterInput,
        data,
        year,
        currentYearData;

    var Filter = Component.extend({
        init: function(context, options) {
            this.name = 'filter';
            this.template = 'components/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        postRender: function() {
            var _this = this;

            $filterInput = $('#filter');
            data = this.model.getData()[0];
            year = this.model.getState("time");
            currentYearData = data.filter(function(row) {
                return (row.time == year);
            });


            $filterInput.autocomplete({
                minLength: 3,
                source: _.map(currentYearData, function (country) { return {value: country.geo, label: country['geo.name']}; }),
                focus: function(event, ui) {
                    event.preventDefault();
                    $(this).val(ui.item.label);
                },
                select: function( event, ui ) {
                    event.preventDefault();
                    $(this).val(ui.item.label);
                    _this.events.trigger('select:item', ui.item.value);
                }
            });

            this.update();
        },

        update: function() {
            this.resize();
        },

        resize: function() {
        },

    });

    return Filter;
});