define([
    'underscore',
    'base/model',
    'managers/events'
], function(_, Model, Events) {


    var ToolModel = Model.extend({
        init: function(data) {
            this.state = new Model();
            this.data = new Model(data);
        },

        getState: function(attr) {
            return this.state.get(attr);
        },

        setState: function(attr, value, silent) {
            // TODO: Here we do validation

            this.state.set(attr, value, silent);
            if (!silent) Events.trigger("change:state", attr, value);
        },

        getData: function(attr) {
            return this.data.get(attr);
        },

        setData: function(attr, value, silent) {
            // TODO: Here we do validation

            this.data.set(attr, value, silent);
            if (!silent) Events.trigger("change:data", attr, value);
        },
       
        //TODO: improve code quality here
        getRange: function() {

            var minValue = 0,
                maxValue = 0,
                minYear = 0,
                maxYear = 0;

            var filtered = this.getData("filtered");
            for(var reg_key in filtered) {
                var reg = filtered[reg_key];

                curr_year_max = _.max(_.keys(reg));
                if(curr_year_max > maxYear) maxYear = curr_year_max;

                curr_year_min = _.min(_.keys(reg));
                if(curr_year_min > minYear) minYear = curr_year_min;

                curr_value_max = _.max(reg, function(value, year) {
                    return value.v;
                }).v;
                if(curr_value_max > maxValue) maxValue = curr_value_max;

                curr_value_min = _.min(reg, function(value, year) {
                    return value.v;
                }).v;
                if(curr_value_min > minValue) minValue = curr_value_min;
            }

            return {
                minValue: minValue,
                maxValue: maxValue,
                minYear: minYear,
                maxYear: maxYear
            }
        }

    });

    return ToolModel;
});