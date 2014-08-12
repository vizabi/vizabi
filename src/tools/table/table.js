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

            //add components
            this.addComponent('table', {
                placeholder: '.vizabi-tool-viz'
            });

            this._super(parent, options);
        },

        // Load must be implemented here
        load: function(events) {

            var _this = this,
                defer = $.Deferred();

            //get info from state
            var language = this.model.getState("language"),
                query = this.getQueryFromState();
                
            //load data and resolve the defer when it's done
            $.when(
                this.model.data.load(query, language, events)
            ).done(function() {
                defer.resolve();
            });

            return defer;
        },

        //build query from state
        getQueryFromState: function() {
            //get info from state
            var countries = this.model.getState("show").country,
                years = this.model.getState("show").year,
                columns = this.model.getState("columns");

            var yearQuery = (years.length > 2) ? years : years.join("-");

            //build query with state info
            var query = [
                {
                    from: 'data',
                    select: columns,
                    where: {
                        country: countries,
                        year: yearQuery
                    }
                },
                {
                    from: 'data',
                    select: ['country', 'name'],
                    where: {
                        country: countries
                    }
                },
            ];

            return query;
        }
    });



    return table;
});