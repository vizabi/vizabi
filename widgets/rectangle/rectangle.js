define([
    'd3',
    'vizabi.base.object'
], function(d3, object) {
    var extend = object.extend;

    var rect = function(sandbox, options, vScale, hScale) {
        this.options = {
            widthThickness: 20,
            heightThickness: 20,
            cssClass: undefined
        };

        extend(this.options, options);

        this.container = sandbox.getSVG();
        this.rectSVG = this.container.append('g')
            .attr('class', this.options.cssClass);

        // Expected here is an array of objects, each object containing a tuple
        // consisting of {x, y, width, height}, where combinations of such
        // elements will draw the expected behavior. For instance, if you want
        // to draw a rectangle in a bar chart the tuple would be <y, width> for
        // a horizontal bar or <x, height> for a vertical bar. The thickness of
        // the bar is set by options.widthThickness and options.heightThickness
        this.data = [];

        // 'vizabi/tools/scale' objects
        this.vScale = vScale;
        this.hScale = hScale;
    };

    rect.prototype = {
        start: function() {
            this.render = this.render.bind(this);
            this.show();
        },

        stop: function() {
            this.hide();
        },

        destroy: function() {
            this.rectSVG.remove();
        },

        render: function(w, h) {
            // w and h here are the values for the entire container where the
            // rectangles are going to be drawn on
            var _this = this;

            this.clean();

            // fill the rectangle size
            this.rectSVG.append('g')
                .attr('class', 'chart-filler')
                .append('rect')
                .attr('x', 0).attr('y', 0)
                .attr('width', w).attr('height', h)
                .attr('opacity', 0);

            var identity = function(d) { return d; };
            var vScale = this.vScale ? this.vScale.get() : identity;
            var hScale = this.hScale ? this.hScale.get() : identity;

            this.rectSVG.append('g')
                .attr('class', 'rectangles')
                .selectAll('rect')
                .data(this.data)
              .enter()
                .append('rect')
                .attr('x', function(d) {
                    var x = d.x;
                    var barThickness = d.width || _this.options.widthThickness;
                    return hScale(x - barThickness / 2) || 0;
                })
                .attr('y', function(d) {
                    return vScale(d.y) || vScale(d.height);
                })
                .attr('width', function(d) {
                    return hScale(d.width || _this.options.widthThickness);
                })
                .attr('height', function(d) {
                    return h - vScale(d.height || _this.options.heightThickness);
                })
                .attr('class', this.options.cssClass);
        },

        clean: function() {
            this.rectSVG.selectAll('rect').remove();
        },

        show: function() {
            this.rectSVG.style('visibility', 'visible');
        },

        hide: function() {
            this.rectSVG.style('visibility', 'hidden');
        },

        set: function(options) {
            extend(this.options, options);
        },

        setData: function(data) {
            this.data = data;
        },

        getGroup: function() {
            return this.rectSVG;
        }
    };

    return rect;
});
