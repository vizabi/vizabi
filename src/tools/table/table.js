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
        }
    });
    
    return table;
});