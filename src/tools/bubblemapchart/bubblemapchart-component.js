import * as utils from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals'; // to get map data path

import topojson from 'helpers/topojson';
import d3_geo_projection from 'helpers/d3.geo.projection';

//BUBBLE MAP CHART COMPONENT
var BubbleMapChartComponent = Component.extend({
  /**
   * Initializes the component (Bubble Map Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init: function (config, context) {
    this.name = 'bubblemapchart';
    this.template = 'bubblemapchart.html';

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "language",
      type: "language"
    }];

    var _this = this;
    this.model_binds = {
      "change:time:value": function (evt) {
        _this.updateEntities();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

    this.yScale = null;
    this.cScale = d3.scale.category10();

    d3_geo_projection();
  },


  afterPreload: function(){
      var _this = this;
      // TODO: add url to config or local
      d3.json(globals.gapminder_paths.baseUrl + "data/world-50m.json", function(error, world) {
        if (error) throw error;
        _this.world = world;
      });
  },

  /**
   * DOM is ready
   */
  readyOnce: function () {

    this.element = d3.select(this.element);

    this.graph = this.element.select('.vzb-bmc-graph');
    this.bubbles = this.graph.select('.vzb-bmc-bubbles');

    var _this = this;
    this.on("resize", function () {
      _this.updateEntities();
    });
  },

  /*
   * Both model and DOM are ready
   */
  ready: function () {
    this.updateIndicators();
    this.resize();
    this.updateEntities();
  },

  /**
   * Changes labels for indicators
   */
  updateIndicators: function () {
    var _this = this;
    this.translator = this.model.language.getTFunction();
    this.duration = this.model.time.speed;

    this.yScale = this.model.marker.axis_y.getScale();
    this.cScale = this.model.marker.color.getScale();
  },

  /**
   * Updates entities
   */
  updateEntities: function () {

    var _this = this;
    var time = this.model.time;
    var timeDim = time.getDimension();
    var entityDim = this.model.entities.getDimension();
    var duration = (time.playing) ? time.speed : 0;
    var filter = {};
    filter[timeDim] = time.value;
    var items = this.model.marker.getKeys(filter);
    var values = this.model.marker.getValues(filter, [entityDim]);

    // TODO: add to csv
    //Africa 9.1021° N, 18.2812°E 
    //Europe 53.0000° N, 9.0000° E
    //Asia 49.8380° N, 105.8203° E
    //north American 48.1667° N and longitude 100.1667° W
    var pos = {
      "afr": {lat: 9.1, lng: 18.3},
      "eur": {lat: 53.0, lng: 9.0},
      "asi": {lat: 49.8, lng: 105.8},
      "ame": {lat: 48.2, lng: -100.2},
    };

    this.entityBubbles = this.bubbles.selectAll('.vzb-bmc-bubble')
      .data(items);

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles.enter().append("circle")
      .attr("class", "vzb-bmc-bubble")
      .on("mousemove", function (d, i) {
      })
      .on("mouseout", function (d, i) {
      })
      .on("click", function (d, i) {
      });

    //positioning and sizes of the bubbles

    var bubbles = this.bubbles.selectAll('.vzb-bmc-bubble');

    this.bubbles.selectAll('.vzb-bmc-bubble')
      .attr("fill", function (d) {
        return _this.cScale(values.color[d[entityDim]]);
      })
      .attr("cx", function (d) {
        return _this.projection([pos[d[entityDim]].lng, pos[d[entityDim]].lat])[0];
      })
      .transition().duration(duration).ease("linear")
      .attr("cy", function (d) {
        return _this.projection([pos[d[entityDim]].lng, pos[d[entityDim]].lat])[1];
      })
      .attr("r", function (d) {
        return _this.yScale(values.axis_y[d[entityDim]]);
      });
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  resize: function () {

    var _this = this;

    this.profiles = {
      "small": {
        margin: {
          top: 30,
          right: 20,
          left: 40,
          bottom: 50
        },
        padding: 2,
        minRadius: 2,
        maxRadius: 40
      },
      "medium": {
        margin: {
          top: 30,
          right: 60,
          left: 60,
          bottom: 60
        },
        padding: 2,
        minRadius: 3,
        maxRadius: 60
      },
      "large": {
        margin: {
          top: 30,
          right: 60,
          left: 60,
          bottom: 80
        },
        padding: 2,
        minRadius: 4,
        maxRadius: 80
      }
    };

    this.activeProfile = this.profiles[this.getLayoutProfile()];
    var margin = this.activeProfile.margin;


    //stage
    var height = this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
    var width = this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //update scales to the new range
    // TODO: r ration should add to config
    if (this.model.marker.axis_y.scaleType !== "ordinal") {
      this.yScale.range([0, this.height / 4]);
    } else {
      this.yScale.rangePoints([0, this.height / 4], _this.activeProfile.padding).range();
    }

    // http://bl.ocks.org/mbostock/d4021aa4dccfd65edffd patterson
    // http://bl.ocks.org/mbostock/3710566 robinson
    // map background
    var world = this.world;
    var projection = this.projection = d3.geo.robinson()
        .clipExtent([[0, 0], [width, height]])
        .scale(150 / 960 * width)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = this.bgPath = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = this.bgSvg = d3.select(".vzb-bmc-map-background")
        .attr("width", width)
        .attr("height", height);
    svg.html('');

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);

  }
});


export default BubbleMapChartComponent;