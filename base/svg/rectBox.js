define([
    'd3'
], function(d3) {
    var rectBox = function(element) {
        return {
            move: function(top, left) {
                var translate = 'translate(' + top + ',' + left + ')';
                element.attr('transform', translate);
            },

            getHeight: function() {
                return element.node().getBBox().height;
            },

            getWidth: function() {
                return element.node().getBBox().width;
            }
        }
    };

    return rectBox;
});
