define([
    'd3'
], function(d3) {
    var text = function(sandbox, options) {
        this.options = {
            text: options.text || 'text',
            id: options.id || 'text',
            eventId: options.eventId || 'change:language',
            cssClass: options.cssClass || undefined,
        };

        this.svgContainer = sandbox.getSVG();

        this.svgGroup = this.svgContainer.append('g')
            .attr('id', this.options.id);

        this.svgTextElement = this.svgGroup.append('text')
            .attr('class', this.options.cssClass)
            .text(this.options.text);

        var height = this.svgTextElement.node().getBBox().height;
        this.svgTextElement.attr('y', height);

        return this;
    };

    text.prototype = {
        start: function() {
            this.svgTextElement.text(this.options.text);
            var height = this.svgTextElement.node().getBBox().height;
            this.svgTextElement.attr('y', height);
            return this;
        },

        set: function(options) {
            extend(this.options, options);
            return this;
        },

        update: function() {
            this.start();
            return this;
        },

        show: function() {
            this.svgGroup.style('visibility', 'visible');
            return this;
        },

        hide: function() {
            this.svgGroup.style('visibility', 'hidden');
            return this;
        },

        remove: function() {
            this.svgGroup.remove();
        },

        getGroup: function() {
            return this.svgGroup;
        }
    };

    return text;
});
