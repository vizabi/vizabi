import Class from 'base/class';

var prefix = "";
var deleteClasses = [];
var SVGHEADER = '<?xml version="1.0" encoding="utf-8"?>';

export default Class.extend({

  init: function(context) {
    this.context = context;
    this.shapes = [];
    this.groups = [];
    this.counter = 0;
    this.name = "";
    this.label = "";
  },

  reset: function() {
    this.container.remove();
    this.context.element.selectAll(".vzb-export-redball").remove();
    this.context.element.selectAll(".vzb-export-counter").remove();
    this.counter = 0;
  },

  prefix: function(arg) {
    if (!arguments.length) return prefix;
    prefix = arg;
    return this;
  },
  deleteClasses: function(arg) {
    if (!arguments.length) return deleteClasses;
    deleteClasses = arg;
    return this;
  },

  open: function(element, name) {
    var _this = this;

    //reset if some exports exists on opening
    if (this.svg) this.reset();

    if (!element) element = this.context.element;
    if (!name) name = this.context.name;
    this.name = name;

    var width = parseInt(element.style("width"), 10) || 0;
    var height = parseInt(element.style("height"), 10) || 0;

    this.container = element.append("div").attr("class", "vzb-svg-export");
    this.svg = this.container.node().appendChild(element.select("svg").node().cloneNode(true));
    this.svg = d3.select(this.svg);
    this.svg
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("version", "1.1")
      .attr("param1", "http://www.w3.org/2000/svg")
      .attr("param2", "http://www.w3.org/1999/xlink")
      .attr("x", "0px")
      .attr("y", "0px")
      .attr("style", "enable-background:new " + "0 0 " + width + " " + height)
      .attr("xml:space", "preserve");

    this.redBall = element.append("div")
      .attr("class", "vzb-export-redball")
      .style("position", "absolute")
      .style("top", "20px")
      .style("right", "20px")
      .style("width", "20px")
      .style("height", "20px")
      .style("background", "red")
      .style("color", "white")
      .style("text-align", "center")
      .style("border-radius", "10px")
      .style("font-size", "14px")
      .style("line-height", "20px")
      .style("opacity", .8)
      .style("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this).style("opacity", 1).text("▼");
        _this.counterEl.text("Download");
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", .8).text("");
        _this.counterEl.text(_this.label);
      })
      .on("click", function() {
        _this.close();
      });

    this.counterEl = element.append("div")
      .attr("class", "vzb-export-counter")
      .style("position", "absolute")
      .style("top", "20px")
      .style("right", "45px")
      .style("color", "red")
      .style("opacity", .8)
      .style("line-height", "20px")
      .style("font-size", "14px")
      .style("text-align", "center");


    this.root = this.svg.select("." + prefix + "graph");

    this.root.selectAll("g, text, svg, line, rect")
      .filter(function() {
        var view = d3.select(this);
        var result = false;
        deleteClasses.forEach(function(one) {
          result = result || view.classed(one);
        });
        return result;
      })
      .remove();

    this.svg.selectAll(".tick line")
      .attr("fill", "none")
      .attr("stroke", "#999");
    this.svg.selectAll("." + prefix + "axis-x path")
      .attr("fill", "none")
      .attr("stroke", "#999");
    this.svg.selectAll("." + prefix + "axis-y path")
      .attr("fill", "none")
      .attr("stroke", "#999");
  },

  write: function(me) {
    var groupBy = "time";

    if (!this.root) this.open();

    //avoid writing the same thing again
    if (this.shapes.indexOf(me.id + "_" + me.time) > -1) return;

    this.shapes.push(me.id + "_" + me.time);


    // check if need to create a new group and do so
    if (this.groups.indexOf(me[groupBy]) == -1) {
      this.root.append("g").attr("id", "g_" + me[groupBy]);
      this.groups.push(me[groupBy]);
    }

    // put a marker into the group
    if (me.opacity == null) me.opacity = .5;
    if (me.fill == null) me.fill = "#ff80dd";

    var marker = this.root.select("#g_" + me[groupBy])
      .append(me.type)
      .attr("id", me.id + "_" + me.time)
      .style("fill", me.fill)
      .style("opacity", me.opacity);

    switch (me.type) {
      case "path":
        marker
          .attr("d", me.d);
        break;

      case "circle":
        marker
          .attr("cx", me.cx)
          .attr("cy", me.cy)
          .attr("r", me.r);
        break;
    }

    this.counter++;
    this.redBall.style("opacity", this.counter % 10 / 12 + .2);
    this.label = me.type + " shapes: " + this.counter;
    this.counterEl.text(this.label);
  },

  close: function() {

    var result = SVGHEADER + " " + this.container.node().innerHTML
      .replace("param1", "xmlns")
      .replace("param2", "xmlns:xlink")
      //round all numbers in SVG code
      .replace(/\d+(\.\d+)/g, function(x) {
        return Math.round(+x * 100) / 100 + "";
      });


    if (result.length / 1024 / 1024 > 2) {

      alert("The file size is " + Math.round(result.length / 1024) +
        "kB, which is too large to download. Will try to print it in the console instead...");
      console.log(result);

    } else {

      var link = document.createElement('a');
      link.download = this.name + " " + this.counter + " shapes" + ".svg";
      link.href = 'data:,' + result;
      link.click();
    }
  }


});
