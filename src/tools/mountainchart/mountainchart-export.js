(function () {

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    
    var SVGHEADER = '<?xml version="1.0" encoding="utf-8"?>';

    Vizabi.Helper.extend("gapminder-mountainchart-export", {

        init: function (context) {
            this.context = context;
            this.shapes = [];
            this.entities = [];
            this.usefulElements = ["vzb-mc-mountains-mergestacked", "vzb-mc-mountains-mergegrouped", "vzb-mc-mountains", "vzb-mc-mountains-labels", "vzb-mc-year", "vzb-mc-axis-labels"];
        },

        reset: function(){
            this.svg.remove();
            this.timeframes = [];
            this.IDs = [];
        },
        
        open: function(element, width, height){
            var _this = this;
            if(this.svg) this.reset();
            
            this.container = element.append("div");
            this.svg = this.container.node().appendChild(element.select("svg").node().cloneNode(true));
            this.svg = d3.select(this.svg);
            
            
            this.svg
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("version", "1.1")
//                .attr("xmlns", "http://www.w3.org/2000/svg")
//                .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
                .attr("x", "0px")
                .attr("y", "0px")
                .attr("style", "enable-background:new " + "0 0 " + width + " " + height)
                .attr("xml:space", "preserve");
            
            this.root = this.svg.select(".vzb-mc-graph");

            this.root.selectAll("g, text")
                .filter(function(){
                    var view = d3.select(this);
                    var result = false;
                    _this.usefulElements.forEach(function(one){ result = result || view.classed(one); })
                    return result;
                })
                .remove();
            
            this.svg.selectAll(".tick line")
                .attr("fill", "none")
                .attr("stroke", "#999");
            
            this.svg.selectAll(".vzb-mc-axis-x path")
                .attr("fill", "none")
                .attr("stroke", "#999");
        },
        
        write: function (me) {
            var groupBy = "time";
            
            //avoid writing the same thing again
            if(this.shapes.indexOf(me.id + "_" + me.time)>-1) return; 
            
            this.shapes.push(me.id + "_" + me.time);
            
            if(me.opacity==null)me.opacity = 0.5;
            if(me.fill==null)me.fill = "#ff80dd";
            
            if(this.entities.indexOf(me[groupBy])==-1) {
                this.root.append("g").attr("id", "g_" + me[groupBy]);
                this.entities.push(me[groupBy]);
            }
            
            
            this.root.select("#g_"+me[groupBy])
//                .append("g")
//                .attr("id", me.id + "_" + me.time + "_2_")
//                .append("g")
//                .attr("id", me.id + "_" + me.time + "_1_")
                .append(me.type)
                .attr("id", me.id + "_" + me.time)
                .style("fill", me.fill)
                .style("opacity", me.opacity)
                .attr("d", me.d);
        },
        
        close: function (me) {
            console.log(this.container);   
        
        }



    });


}).call(this);