define(['visualizations/vizabi', 'vizabi.base.svg.rectBox'], function(Vizabi, RectBox) {
    var newVizabi = function(core, options) {
        // Loads the class.. maybe I can write a extend method
        // (Vizabi.extend({...}))
        var viz = new Vizabi(core, options);

        viz.state = {
            year: 2000,
            testing: true,
            geo: ['WORLD', 'BHA']
        };

        //Width and height
        var w = 500;
        var h = 100;
        
        var dataset = [
            [5, 20], [480, 90], [250, 50], [100, 33], [330, 95],
            [410, 12], [475, 44], [25, 67], [85, 21], [220, 88]
        ];

        //Create SVG element
        var svg = viz.getSVG()
            .append("g")
            .attr("width", w)
            .attr("height", h);

        svg.selectAll("circle")
           .data(dataset)
           .enter()
           .append("circle")
           .attr("cx", function(d) {
                return d[0];
           })
           .attr("cy", function(d) {
                return d[1];
           })
           .attr("r", function(d) {
                return Math.sqrt(h - d[1]);
           });

        svg.selectAll("text")
           .data(dataset)
           .enter()
           .append("text")
           .text(function(d) {
                return d[0] + "," + d[1];
           })
           .attr("x", function(d) {
                return d[0];
           })
           .attr("y", function(d) {
                return d[1];
           })
           .attr("font-family", "sans-serif")
           .attr("font-size", "11px")
           .attr("fill", "red");

        var a = new RectBox(svg);
        console.log(a);

        viz.layout = {
            desktop: {
                scottMurray: {
                    rectBox: a,
                    top: 15,
                    left: 50
                }
            }
        };

        viz.start = function() {
            // This visualizations start function
            this.setLayout(this.layout);
            this.instances.layout.update();
            this.instances.events.bind('resize', function() {
                viz.instances.layout.update();
            })
            return this;
        };

        return viz;
    };

    return newVizabi;
});