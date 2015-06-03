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

            this.colorScale = null;
            this.arc = d3.svg.arc();
            
            this.pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.pop; });
        },

        /**
         * DOM is ready
         */
        readyOnce: function() {

            this.element = d3.select(this.element)
            this.svgEl = this.element.select("svg").append("g");
            
            this.yearEl = this.svgEl.append("text").attr("class", "year");
            this.titleEl = this.svgEl.append("text").attr("class", "title");

            var _this = this;
            this.on("resize", function() {
                _this.resize();
                _this.update();
            });            
        
            this.updateEntities();
            this.resize();
            this.update();
        },


        
        updateEntities: function(){
            this.translator = this.model.language.getTFunction();
            this.timeFormatter = d3.time.format(this.model.time.formatInput);
            this.colorScale = this.model.marker.color.getScale();
            
            this.titleEl.text(this.translator("indicator/pop"));
            this.items = this.model.marker.label.getItems();
            
            this.entities = this.svgEl.selectAll('.vzb-dc-entity')
                .data(this.items);

            //exit selection
            this.entities.exit().remove();

            //enter selection
            this.entities
                .enter().append("g")
                .attr("class", "vzb-dc-entity")
                .each(function(){
                d3.select(this).append("path");
                d3.select(this).append("text").attr("class","label");
            });
        },
        
        
        /**
         * Updates entities
         */
        update: function() {
            
            var _this = this;

            var duration = (this.model.time.playing) ? this.model.time.speed : 0;
            var time = this.model.time.value;
            
            this.yearEl.text(this.timeFormatter(time));

            var data = utils.clone(this.items);
            
            data.forEach(function(d){
                d.pop = _this.model.marker.axis.getValue({geo: d.geo, time: time});
                d.color = _this.model.marker.color.getValue({geo: d.geo, time: time});
                d.label = _this.model.marker.label.getValue({geo: d.geo, time: time});
            });
            
            data = this.pie(data)


            this.entities
                .data(data)
                .select("path")
                .attr("d", this.arc)
                .style("fill", function(d) { return _this.colorScale(d.data.color) })
                .style("stroke", "white")

            this.entities
                .select("text")
                .attr("transform", function(d) { return "translate(" + _this.arc.centroid(d) + ")"; })
                .text(function(d) { return d.data.label; });            
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            var _this = this;

            var height = parseInt(this.element.style("height"));
            var width = parseInt(this.element.style("width"));
            var min = Math.min(height, width);
            
            this.svgEl.attr("transform","translate("+(width/2)+","+(height/2)+")");
            this.titleEl.attr("y", "-0.1em");
            this.yearEl.attr("y", "0.1em");
            
            this.arc
                .outerRadius(min/2 * 0.9)
                .innerRadius(min/2 - min * 0.1)
        }
        
    });

}).call(this);