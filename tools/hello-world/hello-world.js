define([
    'tools/tool'
], function(Tool) {
    var newVizabi = function(core, options) {
        var helloWorld = new Tool(core, options);

        /* Initialization part */

        helloWorld.name = 'hello-world';
        helloWorld.getSVG().classed('hello-world', true);

        // Default state
        helloWorld.state = {
            show: {
                'world': {

                }
            },
            time: '1980',
            yaxis: {
                indicator: 'gdp'
            }
        };

        helloWorld.start = function() {
            return this;
        };

        return helloWorld;
    };

    return newVizabi;
});
