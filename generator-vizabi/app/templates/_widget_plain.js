define([
    'widgets/widget'
], function(Widget) {
    var newWidget = function(sandbox) {
        var <%= _.slugify(widgetName) %> = new Widget(sandbox);

        <%= _.slugify(widgetName) %>.name = '<%= _.slugify(widgetName) %>';
        <%= _.slugify(widgetName) %>.setWidgetClass('<%= _.slugify(widgetName) %>');

        <%= _.slugify(widgetName) %>.start = function() {
            return this;
        }

        <%= _.slugify(widgetName) %>.render = function(width, height) {
            return this;
        }.bind(<%= _.slugify(widgetName) %>);

        return <%= _.slugify(widgetName) %>;
    }

    return newWidget;
});
