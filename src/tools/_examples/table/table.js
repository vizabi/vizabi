define([
    'base/tool'
], function(Tool) {
    var table = Tool.extend({
        init: function(parent, options) {
            this.name = 'table';
            this.template = "tools/_examples/table/table";
            this.placeholder = options.placeholder;
            this.state = options.state;

            //add components
            this.addComponent('_gapminder/header', {
                placeholder: '.vizabi-tool-title'
            });

            this.addComponent('_examples/table', {
                placeholder: '.vizabi-tool-viz'
            });

            this._super(parent, options);
        },

        //build query from state
        
        //TODO: this could be moved to the tool if we find a
        //common state pattern
        getQuery: function() {
            //build query with state info
            var query = [{
                select: [
                    'geo',
                    'time',
                    'geo.name',
                    'geo.category', 
                    this.model.getState("columns")
                ],
                where: {
                    geo: this.model.getState("show").geo,
                    'geo.category': this.model.getState("show")['geo.category'],
                    time: this.model.getState("timeRange")
                }}];

            return query;
        }
    });



    return table;
});