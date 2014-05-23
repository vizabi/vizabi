define([
    'd3',
    'vizabi.base.object'
], function(d3, object) {
    var extend = object.extend;

    var scale = function(options) {
        this.options = {
            type: options.type || 'linear',
            valueStart: options.valueStart || 0,
            valueEnd: options.valueEnd || 0,
            rangeStart: options.rangeStart || 0,
            rangeEnd: options.rangeEnd || 0
        };
    }

    scale.prototype = {
        get: function() {
            var scale;

            if (this.options.type === 'linear') {
                scale = d3.scale.linear();
            } else if (this.options.type === 'log') {
                scale = d3.scale.log();
            }

            if (!scale) return;

            scale
                .domain([this.options.valueStart, this.options.valueEnd])
                .range([this.options.rangeStart, this.options.rangeEnd])
                .clamp(true);

            return scale;
        },

        set: function(options) {
            extend(this.options, options);
        },

        toString: function() {
            return 'type' + this.options.type +
                'start' + this.options.valueStart +
                'end' + this.options.valueEnd +
                'rangeStart' + this.options.rangeStart +
                'rangeEnd' + this.options.rangeEnd;
        }
    }

    return scale;
});
