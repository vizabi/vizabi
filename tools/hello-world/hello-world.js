define([
    'tools/tool'
], function(Tool) {

    var helloWorld = Tool.extend({
        init: function(context, options) {
          //this._super("Testing");
        }
    });

    return helloWorld;



    var newVizabi = function(core, options) {

        var helloWorld = Tool.extend({
            init: function(context, options) {
              console.log("HELLO WORLD!!!");
            }
        });

        return helloWorld;

       
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

        helloWorld.widgets = {}

        var parent = helloWorld.start;
        helloWorld.start(function() {
            return this;
        });


        helloWorld.start();

        return helloWorld;
    };

    return newVizabi;
});
