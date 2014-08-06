define([
    'jquery',
    'base/utils',
    'components/component',
], function($, utils, Component) {

	var container;

    var Table = Component.extend({
        init: function(parent, options) {
            this.template = "components/slider/slider";
            this._super(parent, options);

            range = this.model.getState("timeRange");
            startYear = this.model.getState("time");
        },

        postRender: function() {
            this.placeholder = utils.d3ToJquery(this.placeholder);
            container = utils.d3ToJquery(this.element);

            this.update();
        },


        resize: function() {
            this.update();
        },

        update: function() {
           var _this = this,
           	   year = this.model.getState("time");

           handle.attr("data-year", year);
        },

        getYear: function() {
            return this.model.getState("time");
        },

        setYear: function(year, silent) {
            //update state
            this.model.setState({
                time: year
            }, silent);

            this.update();
        },

    });

    return Table;
});