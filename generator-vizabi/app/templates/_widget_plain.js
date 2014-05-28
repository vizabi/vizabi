define([
    'widgets/widget'
], function(Widget) {
    var newWidget = function(sandbox) {
        var widget = new Widget(sandbox);

        widget.name = '<%= _.slugify(widgetName) %>';
        widget.setWidgetClass('<%= _.slugify(vizabiName) %>');

        widget.start = function() {
            return this;
        }

        widget.render = function(width, height) {
            return this;
        }

        widget.render = widget.render.bind(widget);

        return widget;
    }

    return newWidget;
});
