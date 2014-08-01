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

        // TODO: ensure that the state is not empty
        load: function(options) {
            var _this = this,
                defer = $.Deferred();

            var data_filter = prepareDataFilter(this.getState("show")),
                ids = _.map(data_filter, function(i) {
                    return i.id
                });

            //TODO: crete query here
            var indicator = this.getState("yaxis").indicator,
                language = this.getState("language");

            // include paths to the options 
            options = _.extend(options, {indicator: indicator, language: language});

            //load data and resolve the defer when it's done
            $.when(
                this.data.load(options)
            ).done(function() {
                //TODO: Ola's input in the meeting: add query to tool-model
                //var query = _this.getDataQueryFromState(aState)
                var waffle = _this.getData();

                //TODO: things is a bad name, too generic
                _this.data.set("things", getFilteredThings(waffle, language, data_filter));

                //store indicator for the selected ids
                _this.data.set("filtered", _.pick(waffle.stats[indicator], ids));

                defer.resolve();
            });

            return defer;
        },
        // to be extended
       
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
        },

        getYearData: function() {
            var year = this.getState("time"),
                year_data = _.map(this.getData("filtered"), function(d, i) {
                    return {
                        id: i,
                        value: d[year].v
                    }
                });

            return year_data;
        }

    });

    function getFilteredThings(waffle, lang, filter) {
        var things = {};
        if (!filter) {
            // returns all things from all categories
            for (var category in waffle.definitions[lang].categories) {
                _.extend(things, waffle.definitions[lang].categories[category].things);
            }
        }
        //grab things in the data structure
        else {
            if (!_.isArray(filter)) {
                filter = [filter];
            }
            for (var i = 0, size = filter.length; i < size; i++) {
                var f = filter[i];
                things[f.id] = waffle.definitions[lang].categories[f.category].things[f.id];
            }
        }
        return things;
    }

    // Transform data filter into shallow version

    function prepareDataFilter(show) {

        var result = [];
        //iterate over each category we want to show
        for (var reg_type in show) {
            //if category has sub filters, add them instead
            if (show[reg_type].hasOwnProperty("filter")) {
                for (var reg in show[reg_type].filter) {
                    result.push({
                        category: reg_type,
                        id: show[reg_type].filter[reg]
                    });
                }
            }
            //if not, add the category itself (e.g.: world)
            else {
                result.push({
                    category: reg_type,
                    id: reg_type
                });
            }
        }
        return result;
    }

    return ToolModel;
});