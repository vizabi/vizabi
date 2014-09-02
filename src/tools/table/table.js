define([
    'underscore',
    'base/tool'
], function(_, Tool) {
    var table = Tool.extend({
        init: function(parent, options) {
            this.name = 'table';
            this.template = "tools/table/table";
            this.placeholder = options.placeholder;
            this.state = options.state;

            //add components
            this.addComponent('header', {
                placeholder: '.vizabi-tool-title'
            });

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
            var language = this.model.get("language"),
                query = this.getQuery();
                
            //load data and resolve the defer when it's done
            $.when(
                this.model.data.load(query, language, events)
            ).done(function() {
                defer.resolve();
            });

            return defer;
        },

        //build query from state
        
        //TODO: this could be moved to the tool if we find a
        //common state pattern
        getQuery: function() {
            //build query with state info
            var query = [
                {
                    from: 'data',
                    select: this.model.getState("columns"),
                    where: {
                        entity: this.model.getState("entity"),
                        year: this.model.getState("timeRange")
                    }
                },
                {
                    from: 'data',
                    select: ['entity', 'name'],
                    where: {
                        entity: this.model.getState("entity"),
                    }
                },
            ];

            return query;
        }
    });



    return table;
});