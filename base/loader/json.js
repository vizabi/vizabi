define([
    'd3'
], function(d3) {
    var load = function(url, callback) {
        callback ? d3.json(url, callback) : d3.json(url);
    };

    return {
        load: load
    }
});
