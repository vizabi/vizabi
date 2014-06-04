define([
    'widgets/widget'
], function(Widget) {
    var <%= _.camelize(widgetName) %> = Widget.extend({
        init: function(context, options) {
            this.name = <%= _.slugify(widgetName) %>;
            this._super(context, options);
        }
    });

    return <%= _.camelize(widgetName) %>;
});
