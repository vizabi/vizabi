define(['visualizations/vizabi'], function(Vizabi) {
    var newVizabi = function(core, options) {
        // Loads the class.. maybe I can write a extend method
        // (Vizabi.extend({...}))
        var viz = new Vizabi(core, options);

        viz.state = {
            year: 2000,
            testing: true,
            geo: ['WORLD', 'BHA']
        };

        viz.layout = {

        };

        console.log(viz.getSVG());
        var ball = viz.getSVG().append('div')
            .attr('data', 'lol');

        viz.start = function() {
            // This visualizations start function
            this.setLayout(this.layout);
            return this;
        };

        return viz;
    };

    return newVizabi;
});