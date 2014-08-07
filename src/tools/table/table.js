define([
    'underscore',
    'tools/tool'
], function(_, Tool) {
    var table = Tool.extend({
        init: function(parent, options) {
            this.name = 'table';
            this.template = "tools/table/table";
            this.placeholder = options.placeholder;
            this.state = options.state;
            this.components = {
                'table': '.vizabi-tool-viz',
            };

            this._super(parent, options);
        },

        // Load must be implemented here
        load: function(options) {
            var _this = this,
                defer = $.Deferred();

            var data_filter = prepareDataFilter(this.model.getState("show")),
                ids = _.map(data_filter, function(i) {
                    return i.id
                });

            //TODO: crete query here
            var columns = this.model.getState("columns")
            language = this.model.getState("language"),
            indicators = [];

            for (var i = 0; i < columns.length; i++) {
                if (columns[i].hasOwnProperty("indicator")) {
                    indicators.push(columns[i].indicator);
                }
            }

            // include paths to the options 
            options = _.extend(options, {
                indicator: indicator,
                language: language
            });

            //load data and resolve the defer when it's done
            $.when(
                this.model.data.load(options)
            ).done(function() {
                //TODO: Ola's input in the meeting: add query to tool-model
                //var query = _this.getDataQueryFromState(aState)
                var waffle = _this.model.getData();

                //TODO: things is a bad name, too generic
                _this.model.setData("things", getFilteredThings(waffle, language, data_filter));

                //store indicator for the selected ids
                _this.model.setData("filtered", _.pick(waffle.stats[indicator], ids));

                defer.resolve();
            });

            return defer;
        },

        getYearData: function() {
            var year = this.model.getState("time"),
                year_data = _.map(this.model.getData("filtered"), function(d, i) {
                    return {
                        id: i,
                        value: d[year].v
                    }
                });

            return year_data;
        },
    });

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



    return table;
});