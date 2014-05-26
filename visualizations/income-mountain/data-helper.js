define([], function() {
    var dataHelper = {
        transition: function(data, geo, year, original) {
            var factor = year % 1;
            var future = Math.ceil(year);

            if (original[geo][future]) {
                for (var i = 0; data.length; i++) {
                    var diff = original[geo][future][i].height - d[i].height;
                    d[i].y = d[i].height + (diff * factor);
                }
            }

            return data;
        },

        stack: function(data) {
            return d3.layout.stack()
                .offset('zero')
                .values(function(d) { return d.data; })
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                (data);
        },

        sort: function(data) {
            return data.sort(function(a, b) {
                return b.data.maxHeight - a.data.maxHeight;
            });
        },

        findMaxHeight: function(data) {
            var maxHeight = 0;
            var keys = Object.keys(data);

            for (var i = 0; i < keys.length; i++) {
                maxHeight = Math.max(maxHeight, o[keys[i]].geoMaxHeight);
            }

            return maxHeight;
        },

        propagateHeight: function(data, mountainHeight, maxHeight) {
            for (var i = 0; i < data.length; i++) {
                data[i].y = mountainHeight * data[i].y / maxHeight;
            }

            return data;
        }
    }

    return dataHelper;
});
