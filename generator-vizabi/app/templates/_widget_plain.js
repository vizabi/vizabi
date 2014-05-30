define([
    'widgets/widget'
], function(Widget) {
    var newWidget = function(sandbox) {
        var <%= _.camelize(widgetName) %> = new Widget(sandbox);

        <%= _.camelize(widgetName) %>.name = '<%= _.slugify(widgetName) %>';
        <%= _.camelize(widgetName) %>.setWidgetClass('<%= _.slugify(widgetName) %>');

        <%= _.camelize(widgetName) %>.start = function() {
            return this;
        }

        <%= _.camelize(widgetName) %>.render = function(width, height) {
            return this;
        }.bind(<%= _.camelize(widgetName) %>);

        return <%= _.camelize(widgetName) %>;
    }

    return newWidget;
});
