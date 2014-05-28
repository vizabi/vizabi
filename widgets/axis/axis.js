define([
    'd3',
    'base/object'
], function(d3, object) {
    var extend = object.extend;

    var innerTick = 3;
    var outerTick = 0;
    var tickPadding = 1.5;

    function pushElement(svg) {
        if (svg.node().getBBox().x < 0) {
            var offset = outerTick - svg.node().getBBox().x;
            svg.select('g').attr('transform', 'translate(' + offset + ',0)');
        } else if (svg.node().getBBox().y < 0) {
            var offset = -(outerTick) - svg.node().getBBox().y;
            svg.select('g').attr('transform', 'translate(0,' + offset + ')');
        }
    }

    var axis = function(sandbox, scale, options) {
        this.options = {
            orientation: 'bottom',
            values: undefined,
            tickFormat: undefined,
            cssClass: 'axis'
        };

        extend(this.options, options);

        this.scale = scale;
        this.container = sandbox.getSVG();
        this.axisGroup = this.container.append('g')
            .attr('class', 'axis');
        this.axis = undefined;

        // local binding, ensuring the context of render
        this.render = this.render.bind(this);
    };

    axis.prototype = {
        start: function() {
            var axisBuilder = d3.svg.axis()
                .scale(this.scale.get())
                .orient(this.options.orientation)
                .tickValues(this.options.values)
                .tickSize(innerTick, outerTick)
                .tickPadding(tickPadding);

            if (this.options.values) {
                axisBuilder.ticks(this.options.values.length)
            }

            if (this.options.tickFormat) {
                axisBuilder.tickFormat(this.options.tickFormat);
            }

            if (this.axis) this.axis.remove();

            this.axis = this.axisGroup.append('g')
                .attr('class', this.options.cssClass)
                .call(axisBuilder);

            pushElement(this.axisGroup, this.options.orientation);

            return this;
        },

        stop: function() {
            return this;
        },

        destroy: function() {
            this.axisGroup.remove();
        },

        render: function(w, h) {
            var newLength = w || h;

            if (this.axis) this.axis.remove();

            this.scale.set({ rangeEnd: +newLength });
            this.start();
        },

        set: function(options) {
            extend(this.options, options);
            return this;
        },

        get: function() {
            return this;
        },

        show: function() {
            if (this.axisGroup) this.axisGroup.style('visibility', 'visible');
        },

        hide: function() {
            if (this.axisGroup) this.axisGroup.style('visibility', 'hidden');
        },

        replaceScale: function(scale) {
            this.scale = scale;
            return this;
        },

        getGroup: function() {
            return this.axisGroup;
        }
    };

    return axis;
});
