define([
    'tools/tool'
], function(Tool) {
    var <%= _.camelize(vizabiName) %> = Tool.extend({
        init: function(context, options) {
            this.name = '<%= _.slugify(vizabiName) %>';
            this._super(context, options);
        }
    });

    return <%= _.camelize(vizabiName) %>;
});
