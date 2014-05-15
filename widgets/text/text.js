define([
    'd3',
    'vizabi.base.object'
], function(d3, object) {
    var extend = object.extend;

    var text = function(sandbox, options) {
        this.options = {
            text: 'text',
            id: 'text',
            eventId: 'change:language',
            cssClass: undefined
        };

        extend(this.options, options);

        this.svgContainer = sandbox.getSVG();

        this.svgGroup = this.svgContainer.append('g')
            .attr('id', this.options.id);

        return this;
    };

    text.prototype = {
        start: function() {
            this.svgTextElement = this.svgGroup.append('text')
                .attr('class', this.options.cssClass)
                .text(this.options.text);

            var negativeHeight = this.svgTextElement.node().getBBox().y;
            this.svgTextElement.attr('y', -negativeHeight);
            
            this.show();

            return this;
        },

        stop: function() {
            this.hide();
            return this;
        },

        destroy: function() {
            this.svgGroup.remove();
        },

        show: function() {
            this.svgGroup.style('visibility', 'visible');
            return this;
        },

        hide: function() {
            this.svgGroup.style('visibility', 'hidden');
            return this;
        },

        get: function() {
            return this;
        },

        set: function(options) {
            extend(this.options, options);
            return this;
        },

        // Modify this to be a 'notify' call? Or create a notify call?
        update: function() {
            this.svgTextElement.text(this.options.text);
            return this;
        },

        getGroup: function() {
            return this.svgGroup;
        }
    };

    return text;
});
