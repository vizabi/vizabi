/*!
 * VIZABI DONUTCHART
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    var comp_template = '<div class="vzb-donutchart"><svg class="vzb-donutchart-svg"></svg></div>';

    //DONUT CHART COMPONENT
    Vizabi.Component.extend('gapminder-donutchart', {

        init: function(config, context) {
            this.name = 'donutchart';
            this.template = comp_template;

            //define expected models for this component
            this.model_expects = [
                {name: "time", type: "time"},
                {name: "entities", type: "entities"},
                {name: "marker", type: "model"},
                {name: "language", type: "language"}
            ];

            var _this = this;
            this.model_binds = {
                "change:time:value": function(evt) {
                    _this.update();
                }
            };

            //contructor is the same as any component
            this._super(config, context);

            this.xScale = null;
            this.arc = d3.svg.arc();
            
            this.pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d});
        },

        /**
         * DOM is ready
         */
        readyOnce: function() {

            this.element = d3.select(this.element);
            this.svg = this.element.select("svg");

            var _this = this;
            this.on("resize", function() {
                _this.resize();
                _this.update();
            });
        },

        /*
         * Both model and DOM are ready
         */
        ready: function() {
            this.updateEntities();
            this.resize();
            this.update();
        },


        
        updateEntities: function(){
            this.translator = this.model.language.getTFunction();
            this.timeFormatter = d3.time.format(this.model.time.formatInput);
            this.xScale = this.model.marker.axis.getScale().range([0, 2*Math.PI]);
            
            var items = this.model.marker.label.getItems();
            
            
            this.entities = this.svg.selectAll('.vzb-dc-entity')
                .data(items);

            //exit selection
            this.entities.exit().remove();

            //enter selection
            this.entities.enter().append("g").attr("class", "vzb-dc-entity").append("path");
        },
        
        
        /**
         * Updates entities
         */
        update: function() {
            
            var _this = this;

            var duration = (this.model.time.playing) ? this.model.time.speed : 0;
            var time = this.model.time.value;

//            var g = svg.selectAll(".arc")
//                  .data(pie(data))
//                .enter().append("g")
//                  .attr("class", "arc");

            this.entities.selectAll("path")
                  .attr("d", function(d){console.log(d)})
                  //.style("fill", function(d) { return color(d.data.age); });

//
//            this.bars.selectAll('.vzb-bc-bar')
//                .attr("width", barWidth)
//                .attr("fill", function(d) {
//                    return _this.cScale(_this.model.marker.color.getValue(d));
//                })
//                .attr("x", function(d) {
//                    return _this.xScale(_this.model.marker.axis.getValue(d));
//                })
//                .transition().duration(duration).ease("linear")
//                .attr("y", function(d) {
//                    return _this.yScale(_this.model.marker.axis.getValue(d));
//                })
//                .attr("height", function(d) {
//                    return _this.height - _this.yScale(_this.model.marker.axis.getValue(d));
//                });
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            var _this = this;

            this.profiles = {"small": {thickness:5}, "medium": {thickness:10}, "large": {thickness: 15} };
            var thickness = this.profiles[this.getLayoutProfile()].thickness;

            this.height = parseInt(this.element.style("height"), 10);
            this.width = parseInt(this.element.style("width"), 10);
            
            this.arc
                .outerRadius(Math.min(this.height, this.width)/2)
                .innerRadius(Math.min(this.height, this.width)/2 - thickness)
        }
        
    });

}).call(this);