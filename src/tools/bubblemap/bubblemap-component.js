import * as utils from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals'; // to get map data path
import {
  warn as iconWarn,
  question as iconQuestion,
  close as iconClose
} from 'base/iconset';

import topojson from 'helpers/topojson';
import d3_geo_projection from 'helpers/d3.geo.projection';
import DynamicBackground from 'helpers/d3.dynamicBackground';
//import Selectlist from './bubblemap-selectlist';

//BUBBLE MAP CHART COMPONENT
var BubbleMapComponent = Component.extend({
  /**
   * Initializes the component (Bubble Map Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init: function (config, context) {
    this.name = 'bubblemap';
    this.template = 'bubblemap.html';
    this.bubblesDrawing = null;


    //http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
    var mobileAndTabletcheck = function() {
      var check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    };
    this.isMobile = mobileAndTabletcheck();

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
    }, {
      name: "ui",
      type: "model"
    }];

    var _this = this;
    this.model_binds = {
      "change:time.value": function (evt) {
        _this.updateTime();
        _this.updateDoubtOpacity();
        _this.redrawDataPoints(null, false);
      },
      "change:entities.highlight": function (evt) {
        if (!_this._readyOnce) return;
        _this.highlightEntities();
        _this.updateOpacity();
      },
      "change:marker": function(evt, path) {
        // bubble size change is processed separately
        if(!_this._readyOnce) return;

        if(path.indexOf("scaleType") > -1) _this.ready();
      },
      'change:marker.size': function(evt, path) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        if(path.indexOf("domainMin") > -1 || path.indexOf("domainMax") > -1) {
          _this.updateMarkerSizeLimits();
          _this.redrawDataPoints(null, false);
          return;
        }
      },
      "change:marker.color.palette": function (evt, path) {
          if (!_this._readyOnce) return;
          _this.redrawDataPoints(null, false);
      },
      "change:entities.select": function (evt) {
          if (!_this._readyOnce) return;
          _this.selectEntities();
          _this.redrawDataPoints(null, false);
          _this.updateOpacity();
          _this.updateDoubtOpacity();

      },
      "change:entities.opacitySelectDim": function (evt) {
          _this.updateOpacity();
      },
      "change:entities.opacityRegular": function (evt) {
          _this.updateOpacity();
      },
    };

    //this._selectlist = new Selectlist(this);

    //contructor is the same as any component
    this._super(config, context);

    this.sScale = null;
    this.cScale = d3.scale.category10();


    this.cached = {};
    // default UI settings
    this.ui = utils.extend({
      labels: {}
    }, this.ui["vzb-tool-" + this.name]);

    this.ui.labels = utils.extend({
      autoResolveCollisions: false,
      dragging: true
    }, this.ui.labels);

    this.labelDragger = d3.behavior.drag()
      .on("dragstart", function(d, i) {
        d3.event.sourceEvent.stopPropagation();
        var KEY = _this.KEY;
        _this.druging = d[KEY];
      })
      .on("drag", function(d, i) {

        var KEY = _this.KEY;
        if(!_this.ui.labels.dragging) return;
        //_this.cached[d[KEY]].scaledS0 = 0; // to extend line when radius shorten
        var cache = _this.cached[d[KEY]];
        cache.labelFixed = true;

        cache.labelX_ += d3.event.dx / _this.width;
        cache.labelY_ += d3.event.dy / _this.height;

        var resolvedX = (cache.labelX0 + cache.labelX_) * _this.width;
        var resolvedY = (cache.labelY0 + cache.labelY_) * _this.height;

        var resolvedX0 = cache.labelX0 * _this.width;
        var resolvedY0 = cache.labelY0 * _this.height;

        var lineGroup = _this.entityLines.filter(function(f) {
          return f[KEY] == d[KEY];
        });

        _this._repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, 0, lineGroup);
      })
      .on("dragend", function(d, i) {
        var KEY = _this.KEY;
        _this.druging = null;
        _this.model.entities.setLabelOffset(d, [
          _this.cached[d[KEY]].labelX_,
          _this.cached[d[KEY]].labelY_
        ]);
      });


    this.defaultWidth = 960;
    this.defaultHeight = 500;
    this.boundBox = [[0.06, 0], [1.0, 0.85]]; // two points to set box bound on 960 * 500 image;

    d3_geo_projection();
  },


  afterPreload: function(){
    if(!this.world) utils.warn("bubble map afterPreload: missing country shapes " + this.world);

    // http://bl.ocks.org/mbostock/d4021aa4dccfd65edffd patterson
    // http://bl.ocks.org/mbostock/3710566 robinson
    // map background
    var defaultWidth = this.defaultWidth;
    var defaultHeight = this.defaultHeight;
    var world = this.world;
    var projection = this.projection = d3.geo.robinson()
        .scale(150)
        .translate([defaultWidth / 2, defaultHeight / 2])
        .precision(.1);

    var path = this.bgPath = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = this.mapGraph = d3.select(this.element).select(".vzb-bmc-map-graph")
        .attr("width", defaultWidth)
        .attr("height", defaultHeight);
    svg.html('');

    /* // no latlng line
    svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    */

    svg.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);
  },

  /**
   * DOM is ready
   */
  readyOnce: function () {

    this.element = d3.select(this.element);

    this.graph = this.element.select('.vzb-bmc-graph');
    this.mapSvg = this.element.select('.vzb-bmc-map-background');

    this.bubbleContainerCrop = this.graph.select('.vzb-bmc-bubbles-crop');
    this.bubbleContainer = this.graph.select('.vzb-bmc-bubbles');
    this.labelListContainer = this.graph.select('.vzb-bmc-bubble-labels');
    this.labelsContainer = this.graph.select('.vzb-bmc-labels');
    this.linesContainer = this.graph.select('.vzb-bmc-lines');
    this.dataWarningEl = this.graph.select(".vzb-data-warning");

    this.yTitleEl = this.graph.select(".vzb-bmc-axis-y-title");
    this.cTitleEl = this.graph.select(".vzb-bmc-axis-c-title");
    this.infoEl = this.graph.select(".vzb-bmc-axis-info");

    this.entityBubbles = null;
    this.entityLabels = null;
    this.tooltip = this.element.select('.vzb-bmc-tooltip');
    this.entityLines = null;

    // year background
    this.yearEl = this.graph.select('.vzb-bmc-year');
    this.year = new DynamicBackground(this.yearEl);
    this.year.setConditions({xAlign: 'left', yAlign: 'bottom', bottomOffset: 5});

    var _this = this;
    this.on("resize", function () {

      _this.updateSize();
      _this.updateMarkerSizeLimits();
      _this.redrawDataPoints();
      //_this._selectlist.redraw();

    });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();


    this.updateUIStrings();

    this.wScale = d3.scale.linear()
        .domain(this.parent.datawarning_content.doubtDomain)
        .range(this.parent.datawarning_content.doubtRange);



  },

  /*
   * Both model and DOM are ready
   */
  ready: function () {
    this.updateUIStrings();
    this.updateIndicators();
    this.updateSize();
    this.updateMarkerSizeLimits();
    this.updateEntities();
    this.updateTime();
    this.redrawDataPoints();
    this.highlightEntities();
    this.selectEntities();
//    this._selectlist.redraw();
    this.updateDoubtOpacity();
    this.updateOpacity();
  },

  updateUIStrings: function () {
      var _this = this;

      this.translator = this.model.language.getTFunction();
      var sizeMetadata = globals.metadata.indicatorsDB[this.model.marker.size.which];

      this.strings = {
          title: {
            S: this.translator("indicator/" + _this.model.marker.size.which),
            C: this.translator("indicator/" + _this.model.marker.color.which)
          }
      };

      this.yTitleEl.select("text")
          .text(this.translator("buttons/size") + ": " + this.strings.title.S)
          .on("click", function() {
            _this.parent
              .findChildByName("gapminder-treemenu")
              .markerID("size")
              .alignX("left")
              .alignY("top")
              .updateView()
              .toggle();
          });

      this.cTitleEl.select("text")
          .text(this.translator("buttons/color") + ": " + this.strings.title.C)
          .on("click", function() {
            _this.parent
              .findChildByName("gapminder-treemenu")
              .markerID("color")
              .alignX("left")
              .alignY("top")
              .updateView()
              .toggle();
          });

      utils.setIcon(this.dataWarningEl, iconWarn).select("svg").attr("width", "0px").attr("height", "0px");
      this.dataWarningEl.append("text")
          .attr("text-anchor", "end")
          .text(this.translator("hints/dataWarning"));

      this.infoEl
          .html(iconQuestion)
          .select("svg").attr("width", "0px").attr("height", "0px");

      //TODO: move away from UI strings, maybe to ready or ready once
      this.infoEl.on("click", function () {
          window.open(sizeMetadata.sourceLink, "_blank").focus();
      })

      this.dataWarningEl
          .on("click", function () {
              _this.parent.findChildByName("gapminder-datawarning").toggle();
          })
          .on("mouseover", function () {
              _this.updateDoubtOpacity(1);
          })
          .on("mouseout", function () {
              _this.updateDoubtOpacity();
          })
  },

  // show size number on title when hovered on a bubble
  updateTitleNumbers: function(){
      var _this = this;

      var mobile; // if is mobile device and only one bubble is selected, update the ytitle for the bubble
      if (_this.isMobile && _this.model.entities.select && _this.model.entities.select.length === 1) {
        mobile = _this.model.entities.select[0];
      }

      if(_this.hovered || mobile) {
        var hovered = _this.hovered || mobile;
        var formatterS = _this.model.marker.size.tickFormatter;
        var formatterC = _this.model.marker.color.tickFormatter;

        _this.yTitleEl.select("text")
          .text(_this.translator("buttons/size") + ": " +
                formatterS(_this.values.size[hovered[_this.KEY]]) + " " +
                _this.translator("unit/" + _this.model.marker.size.which));

        _this.cTitleEl.select("text")
          .text(_this.translator("buttons/color") + ": " +
                formatterC(_this.values.color[hovered[_this.KEY]]) + " " +
                _this.translator("unit/" + _this.model.marker.color.which));

        this.infoEl.classed("vzb-hidden", true);
      }else{
        this.yTitleEl.select("text")
            .text(this.translator("buttons/size") + ": " + this.strings.title.S);
        this.cTitleEl.select("text")
            .text(this.translator("buttons/color") + ": " + this.strings.title.C);

        this.infoEl.classed("vzb-hidden", false);
      }
  },

  updateDoubtOpacity: function (opacity) {
      if (opacity == null) opacity = this.wScale(+this.time.getUTCFullYear().toString());
      if (this.someSelected) opacity = 1;
      this.dataWarningEl.style("opacity", opacity);
  },

  updateOpacity: function () {
      var _this = this;
      /*
      this.entityBubbles.classed("vzb-selected", function (d) {
          return _this.model.entities.isSelected(d);
      });
      */

      var OPACITY_HIGHLT = 1.0;
      var OPACITY_HIGHLT_DIM = .3;
      var OPACITY_SELECT = 1.0;
      var OPACITY_REGULAR = this.model.entities.opacityRegular;
      var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

      this.entityBubbles.style("opacity", function (d) {

          if (_this.someHighlighted) {
              //highlight or non-highlight
              if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
          }

          if (_this.someSelected) {
              //selected or non-selected
              return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
          }

          if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

          return OPACITY_REGULAR;

      });

      this.entityBubbles.classed("vzb-selected", function (d) {
          return _this.model.entities.isSelected(d)
      });

      var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < .01;

      // when pointer events need update...
      if (someSelectedAndOpacityZero !== this.someSelectedAndOpacityZero_1) {
          this.entityBubbles.style("pointer-events", function (d) {
              return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                  "visible" : "none";
          });
      }

      this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < .01;
  },

  /**
   * Changes labels for indicators
   */
  updateIndicators: function () {
    this.sScale = this.model.marker.size.getScale();
    this.cScale = this.model.marker.color.getScale();
  },

  /**
   * Updates entities
   */
  updateEntities: function () {

    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.TIMEDIM;

    var getKeys = function(prefix) {
      prefix = prefix || "";
      return this.model.marker.getKeys()
        .map(function(d) {
          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer[TIMEDIM] = endTime;
          pointer.sortValue = _this.values.size[d[KEY]]||0;
          pointer[KEY] = prefix + d[KEY];
          return pointer;
        })
        .sort(function(a, b) {
          return b.sortValue - a.sortValue;
        })
    };

    // get array of GEOs, sorted by the size hook
    // that makes larger bubbles go behind the smaller ones
    var endTime = this.model.time.end;
    _this.values = this.model.marker.getFrame(endTime);
    this.model.entities.setVisible(getKeys.call(this));


    // TODO: add to csv
    //Africa 9.1021° N, 18.2812°E
    //Europe 53.0000° N, 9.0000° E
    //Asia 49.8380° N, 105.8203° E
    //north American 48.1667° N and longitude 100.1667° W
    /*
    var pos = {
      "afr": {lat: 9.1, lng: 18.3},
      "eur": {lat: 53.0, lng: 9.0},
      "asi": {lat: 49.8, lng: 105.8},
      "ame": {lat: 48.2, lng: -100.2},
    };
    */


    this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bmc-bubble')
      .data(this.model.entities.getVisible(), function(d) { return d[KEY]; })
      .order();

    //exit selection
    this.entityBubbles.exit().remove();

    //enter selection -- init circles
    this.entityBubbles.enter().append("circle")
      .attr("class", "vzb-bmc-bubble")
      .on("mouseover", function (d, i) {
          if (utils.isTouchDevice()) return;
          _this._interact()._mouseover(d, i);
      })
      .on("mouseout", function (d, i) {
          if (utils.isTouchDevice()) return;
          _this._interact()._mouseout(d, i);
      })
      .on("click", function (d, i) {
          if (utils.isTouchDevice()) return;
          _this._interact()._click(d, i);
          _this.highlightEntities();
      })
      .onTap(function (d, i) {
          _this._interact()._click(d, i);
          d3.event.stopPropagation();
      })
      .onLongTap(function (d, i) {
      })

  },

  redrawDataPoints: function(duration, reposition){
    var _this = this;
    if(!duration) duration = this.duration;
    if(!reposition) reposition = true;

    this.entityBubbles.each(function(d, index){
      var view = d3.select(this);

      var valueX = _this.values.lng[d[_this.KEY]]||0;
      var valueY = _this.values.lat[d[_this.KEY]]||0;
      var valueS = _this.values.size[d[_this.KEY]]||0;
      var valueC = _this.values.color[d[_this.KEY]];
      var valueL = _this.values.label[d[_this.KEY]];

      d.hidden_1 = d.hidden;
      d.hidden = !valueS || !valueX || !valueY;

      if(d.hidden !== d.hidden_1) view.classed("vzb-hidden", d.hidden);

      if(!d.hidden){

          d.r = utils.areaToRadius(_this.sScale(valueS));
          d.label = valueL;

          view.classed("vzb-hidden", false)
              .attr("fill", valueC?_this.cScale(valueC):"transparent")

          if(reposition){
              d.cLoc = _this.skew(_this.projection([valueX, valueY]));

              view.attr("cx", d.cLoc[0])
                  .attr("cy", d.cLoc[1]);
          }

          if(duration){
            if (!d.transitionInProgress) {
              d.transitionInProgress = true;
              view.transition().duration(duration).ease("linear")
                .attr("r", d.r)
                .each("end", function () {
                  d.transitionInProgress = false;
                });
            } else {
              d.transitionInProgress = false;
              view.interrupt().attr("r", d.r)
            }
          }else{
              d.transitionInProgress = false;
              view.interrupt()
                  .attr("r", d.r);
          }

          _this._updateLabel(d, index, d.cLoc[0], d.cLoc[1], d.r, d.label, duration);
        }

      });
  },

  /*
   * UPDATE TIME:
   * Ideally should only update when time or data changes
   */
  updateTime: function() {
    var _this = this;

    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;
    this.year.setText(this.model.time.timeFormat(this.time));
    this.values = this.model.marker.getFrame(this.time);

    //possibly update the exact value in size title
    this.updateTitleNumbers();
  },


  fitSizeOfTitles: function(){

    //reset font sizes first to make the measurement consistent
    var yTitleText = this.yTitleEl.select("text")
      .style("font-size", null);
    var cTitleText = this.cTitleEl.select("text")
      .style("font-size", null);

    var yTitleText = this.yTitleEl.select("text");
    var cTitleText = this.cTitleEl.select("text");

    var yTitleBB = yTitleText.node().getBBox();
    var cTitleBB = cTitleText.classed('vzb-hidden') ? yTitleBB : cTitleText.node().getBBox();

    var font =
        Math.max(parseInt(yTitleText.style("font-size")), parseInt(cTitleText.style("font-size")))
        * this.width / Math.max(yTitleBB.width, cTitleBB.width);

    if(Math.max(yTitleBB.width, cTitleBB.width) > this.width) {
      yTitleText.style("font-size", font + "px");
      cTitleText.style("font-size", font + "px");
    } else {

      // Else - reset the font size to default so it won't get stuck
      yTitleText.style("font-size", null);
      cTitleText.style("font-size", null);
    }

  },


  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  updateSize: function () {

    var _this = this;
    var margin, infoElHeight;

    var profiles = {
      small: {
        margin: { top: 10, right: 10, left: 10, bottom: 0 },
        infoElHeight: 16,
        minRadius: 0.5,
        maxRadius: 30
      },
      medium: {
        margin: { top: 20, right: 20, left: 20, bottom: 30 },
        infoElHeight: 20,
        minRadius: 1,
        maxRadius: 55
      },
      large: {
        margin: { top: 30, right: 30, left: 30, bottom: 35 },
        infoElHeight: 22,
        minRadius: 1,
        maxRadius: 70
      }
    };

    var presentationProfileChanges = {
      medium: {
        infoElHeight: 26
      },
      large: {
        infoElHeight: 32
      }
    };

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);
    margin = this.activeProfile.margin;
    infoElHeight = this.activeProfile.infoElHeight;

    //stage
    var height = this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
    var width = this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;
    var boundBox = this.boundBox;
    var viewBox = [ boundBox[0][0] * this.defaultWidth,
                    boundBox[0][1] * this.defaultHeight,
                    Math.abs(boundBox[1][0] - boundBox[0][0]) * this.defaultWidth,
                    Math.abs(boundBox[1][1] - boundBox[0][1]) * this.defaultHeight];

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.resize(this.width, this.height,
      Math.min(this.width/2.5, Math.max(this.height / 4, this.width / 4)) / 2.5);

    this.mapSvg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', viewBox.join(' '))
      .attr('preserveAspectRatio', 'none')
      .style("transform", "translate3d(" + margin.left + "px," + margin.top + "px,0)");

    //update scales to the new range
    //this.updateMarkerSizeLimits();
    //this.sScale.range([0, this.height / 4]);

    var skew = this.skew = (function () {
      var vb = viewBox;
      var w = width;
      var h = height;
      var vbCenter = [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2];
      var vbWidth = vb[2] || 0.001;
      var vbHeight = vb[3] || 0.001;
      //input pixel loc after projection, return pixel loc after skew;
      return function (points) {
        var x = (points[0] - vbCenter[0]) / vbWidth * width + width / 2;
        var y = (points[1] - vbCenter[1]) / vbHeight * height + height / 2;
        return [x, y];
      }
    }());


    this.yTitleEl
        .style("font-size", infoElHeight)
        .attr("transform", "translate(0," + margin.top + ")")

    var yTitleBB = this.yTitleEl.select("text").node().getBBox();

    this.cTitleEl.select("text")
        .attr("transform", "translate(" + 0 + "," + (margin.top + yTitleBB.height) + ")")
        .classed("vzb-hidden", this.model.marker.color.which.indexOf("geo") != -1);

    var warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
        .attr("width", warnBB.height * 0.75)
        .attr("height", warnBB.height * 0.75)
        .attr("x", -warnBB.width - warnBB.height * 1.2)
        .attr("y", -warnBB.height * 0.65)

    this.dataWarningEl
        .attr("transform", "translate(" + (this.width) + "," + (this.height - warnBB.height * 0.5) + ")")
        .select("text");

    if(this.infoEl.select('svg').node()) {
        var titleBBox = this.yTitleEl.node().getBBox();
        var translate = d3.transform(this.yTitleEl.attr('transform')).translate;

        this.infoEl.select('svg')
            .attr("width", infoElHeight)
            .attr("height", infoElHeight)
        this.infoEl.attr('transform', 'translate('
            + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
            + (translate[1] - infoElHeight * 0.8) + ')');
    }
  },

  updateMarkerSizeLimits: function() {
    var _this = this;
    var minRadius = this.activeProfile.minRadius;
    var maxRadius = this.activeProfile.maxRadius;

    this.minRadius = Math.max(maxRadius * this.model.marker.size.domainMin, minRadius);
    this.maxRadius = Math.max(maxRadius * this.model.marker.size.domainMax, minRadius);

    if(this.model.marker.size.scaleType !== "ordinal") {
      this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
    } else {
      this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
    }

  },

  _interact: function () {
      var _this = this;

      return {
          _mouseover: function (d, i) {
              if (_this.model.time.dragging) return;

              _this.model.entities.highlightEntity(d);

              _this.hovered = d;
              //put the exact value in the size title
              _this.updateTitleNumbers();
              _this.fitSizeOfTitles();

              if (_this.model.entities.isSelected(d)) { // if selected, not show hover tooltip
                _this._setTooltip();
              } else {
                //position tooltip
                _this._setTooltip(d);
              }
          },
          _mouseout: function (d, i) {
              if (_this.model.time.dragging) return;
              _this._setTooltip();
              _this.hovered = null;
              _this.updateTitleNumbers();
              _this.fitSizeOfTitles();
              _this.model.entities.clearHighlighted();
          },
          _click: function (d, i) {
              _this.model.entities.selectEntity(d);
          }
      };

  },


  highlightEntities: function () {
      var _this = this;
      this.someHighlighted = (this.model.entities.highlight.length > 0);


//      if (!this.selectList || !this.someSelected) return;
//      this.selectList.classed("vzb-highlight", function (d) {
//          return _this.model.entities.isHighlighted(d);
//      });
//      this.selectList.each(function (d, i) {
//        d3.select(this).selectAll(".vzb-bmc-label-x")
//          .classed("vzb-invisible", function(n) {
//            return !_this.model.entities.isHighlighted(d);
//          });
//
//      });

  },

  _updateLabel: function(d, index, valueX, valueY, scaledS, valueL, duration) {
    var _this = this;
    var KEY = this.KEY;
    if(d[KEY] == _this.druging)
      return;

    if(_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};

    var cached = _this.cached[d[KEY]];
    if(duration == null) duration = _this.duration;

    // only for selected entities
    if(_this.model.entities.isSelected(d) && _this.entityLabels != null) {

      var select = utils.find(_this.model.entities.select, function(f) {
        return f[KEY] == d[KEY]
      });

      var lineGroup = _this.entityLines.filter(function(f) {
        return f[KEY] == d[KEY];
      });
      // reposition label
      _this.entityLabels.filter(function(f) {
          return f[KEY] == d[KEY]
        })
        .each(function(groupData) {

          cached.valueX = valueX;
          cached.valueY = valueY;

          var limitedX, limitedY, limitedX0, limitedY0;
          if(cached.scaledS0 == null || cached.labelX0 == null || cached.labelX0 == null) { //initialize label once
            cached.scaledS0 = scaledS;
            cached.labelX0 = valueX / _this.width;
            cached.labelY0 = valueY / _this.height;
          }
          var labelGroup = d3.select(this);

          var text = labelGroup.selectAll(".vzb-bmc-label-content")
            .text(valueL);

          lineGroup.select("line").style("stroke-dasharray", "0 " + scaledS + " 100%");

          var rect = labelGroup.select("rect");

          var contentBBox = text[0][0].getBBox();
          if(!cached.contentBBox || cached.contentBBox.width != contentBBox.width) {
            cached.contentBBox = contentBBox;

            var labelCloseGroup = labelGroup.select(".vzb-bmc-label-x")
              .attr("x", /*contentBBox.height * .0 + */ 4)
              .attr("y", contentBBox.height * -1);

            labelCloseGroup.select("circle")
              .attr("cx", /*contentBBox.height * .0 + */ 4)
              .attr("cy", contentBBox.height * -1)
              .attr("r", contentBBox.height * .5);

            labelCloseGroup.select("svg")
              .attr("x", -contentBBox.height * .5 + 4)
              .attr("y", contentBBox.height * -1.5)
              .attr("width", contentBBox.height)
              .attr("height", contentBBox.height)

            rect.attr("width", contentBBox.width + 8)
              .attr("height", contentBBox.height * 1.2)
              .attr("x", -contentBBox.width - 4)
              .attr("y", -contentBBox.height * .85)
              .attr("rx", contentBBox.height * .2)
              .attr("ry", contentBBox.height * .2);
          }

          limitedX0 = cached.labelX0 * _this.width;
          limitedY0 = cached.labelY0 * _this.height;

          cached.labelX_ = select.labelOffset[0] || (-cached.scaledS0 * .75 - 5) / _this.width;
          cached.labelY_ = select.labelOffset[1] || (-cached.scaledS0 * .75 - 11) / _this.height;

          limitedX = limitedX0 + cached.labelX_ * _this.width;
          if(limitedX - cached.contentBBox.width <= 0) { //check left
            cached.labelX_ = (cached.scaledS0 * .75 + cached.contentBBox.width + 10) / _this.width;
            limitedX = limitedX0 + cached.labelX_ * _this.width;
          } else if(limitedX + 15 > _this.width) { //check right
            cached.labelX_ = (_this.width - 15 - limitedX0) / _this.width;
            limitedX = limitedX0 + cached.labelX_ * _this.width;
          }
          limitedY = limitedY0 + cached.labelY_ * _this.height;
          if(limitedY - cached.contentBBox.height <= 0) { // check top
            cached.labelY_ = (cached.scaledS0 * .75 + cached.contentBBox.height) / _this.height;
            limitedY = limitedY0 + cached.labelY_ * _this.height;
          } else if(limitedY + 10 > _this.height) { //check bottom
            cached.labelY_ = (_this.height - 10 - limitedY0) / _this.height;
            limitedY = limitedY0 + cached.labelY_ * _this.height;
          }

          _this._repositionLabels(d, index, this, limitedX, limitedY, limitedX0, limitedY0, duration, lineGroup);

        })
    } else {
      //for non-selected bubbles
      //make sure there is no cached data
      if(_this.cached[d[KEY]] != null) {
        _this.cached[d[KEY]] = void 0;
      }
    }
  },

  _repositionLabels: function(d, index, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration, lineGroup) {
    var _this = this;
    var cache = this.cached[d[this.KEY]];

    var labelGroup = d3.select(context);

    var width = parseInt(labelGroup.select("rect").attr("width"));
    var height = parseInt(labelGroup.select("rect").attr("height"));

    var labelX0 = cache.labelX0 * _this.width;
    var labelY0 = cache.labelY0 * _this.height;

    if(resolvedX - width <= 0) { //check left
      cache.labelX_ = (width - labelX0) / this.width;
      resolvedX = labelX0 + cache.labelX_ * this.width;
    } else if(resolvedX + 20 > this.width) { //check right
      cache.labelX_ = (this.width - 20 - labelX0) / this.width;
      resolvedX = labelX0 + cache.labelX_ * this.width;
    }
    if(resolvedY - (height + 30) <= 0) { // check top // not conflict with color label, 25
      cache.labelY_ = (height + 30 - labelY0) / this.height;
      resolvedY = labelY0 + cache.labelY_ * this.height;
    } else if(resolvedY + 13 > this.height) { //check bottom
      cache.labelY_ = (this.height - 13 - labelY0) / this.height;
      resolvedY = cache.labelY0 + cache.labelY_ * this.height;
    }

    if(duration) {
      labelGroup
        .transition().duration(duration).ease("linear")
        .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
      lineGroup.transition().duration(duration).ease("linear")
        .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
    } else {
      labelGroup
          .interrupt()
          .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
      lineGroup
          .interrupt()
          .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
    }

    var diffX1 = resolvedX0 - resolvedX;
    var diffY1 = resolvedY0 - resolvedY;
    var diffX2 = 0;
    var diffY2 = 0;

    var angle = Math.atan2(diffX1 + width / 2, diffY1 + height / 2) * 180 / Math.PI;
    // middle bottom
    if(Math.abs(angle) <= 45) {
      diffX2 = width / 2;
      diffY2 = 0
    }
    // right middle
    if(angle > 45 && angle < 135) {
      diffX2 = 0;
      diffY2 = height / 4;
    }
    // middle top
    if(angle < -45 && angle > -135) {
      diffX2 = width - 4;
      diffY2 = height / 4;
    }
    // left middle
    if(Math.abs(angle) >= 135) {
      diffX2 = width / 2;
      diffY2 = height / 2
    }

    lineGroup.selectAll("line")
      .attr("x1", diffX1)
      .attr("y1", diffY1)
      .attr("x2", -diffX2)
      .attr("y2", -diffY2);

  },

  selectEntities: function () {
      var _this = this;
      var KEY = this.KEY;
      this.someSelected = (this.model.entities.select.length > 0);

//      this._selectlist.rebuild();

      this.entityLabels = this.labelsContainer.selectAll('.vzb-bmc-entity')
        .data(_this.model.entities.select, function(d) {
          //console.log(_this.model.entities.select);
          return(d[KEY]);
        });
      this.entityLines = this.linesContainer.selectAll('.vzb-bmc-entity')
        .data(_this.model.entities.select, function(d) {
          return(d[KEY]);
        });

      this.entityLabels.exit()
        .remove();
      this.entityLines.exit()
        .remove();

      this.entityLines
        .enter().append('g')
        .attr("class", "vzb-bmc-entity")
        .each(function(d, index) {
          d3.select(this).append("line").attr("class", "vzb-bmc-label-line");
        });

      this.entityLabels
        .enter().append("g")
        .attr("class", "vzb-bmc-entity")
        .call(_this.labelDragger)
        .each(function(d, index) {
          var view = d3.select(this);

          view.append("rect");

          view.append("text").attr("class", "vzb-bmc-label-content vzb-label-shadow");

          view.append("text").attr("class", "vzb-bmc-label-content");

          var cross = view.append("g").attr("class", "vzb-bmc-label-x vzb-transparent");
          utils.setIcon(cross, iconClose);

          cross.insert("circle", "svg");

          cross.select("svg")
            .attr("class", "vzb-bmc-label-x-icon")
            .attr("width", "0px")
            .attr("height", "0px");

          cross.on("click", function() {
            _this.model.entities.clearHighlighted();
            //default prevented is needed to distinguish click from drag
            if(d3.event.defaultPrevented) return;
            _this.model.entities.selectEntity(d);
          });
        })
        .on("mouseover", function(d) {
          if(utils.isTouchDevice()) return;
          _this.model.entities.highlightEntity(d);
          d3.select(this).selectAll(".vzb-bmc-label-x")
            .classed("vzb-transparent", false);
        })
        .on("mouseout", function(d) {
          if(utils.isTouchDevice()) return;
          _this.model.entities.clearHighlighted();
          d3.select(this).selectAll(".vzb-bmc-label-x")
            .classed("vzb-transparent", true);
        })
        .on("click", function(d) {
          if (!utils.isTouchDevice()) return;
          var cross = d3.select(this).selectAll(".vzb-bmc-label-x");
          cross.classed("vzb-transparent", !cross.classed("vzb-transparent"));
        })


        // hide recent hover tooltip
        if (!_this.hovered || _this.model.entities.isSelected(_this.hovered)) {
          _this._setTooltip();
        }

  },

  _setTooltip: function (d) {
    var _this = this;
    if (d) {
      var tooltipText = d.label;
      var x = d.cLoc[0];
      var y = d.cLoc[1];
      var offset = d.r;
      var mouse = d3.mouse(this.graph.node()).map(function(d) {
        return parseInt(d)
      });
      var xPos, yPos, xSign = -1,
        ySign = -1,
        xOffset = 0,
        yOffset = 0;

      if(offset) {
        xOffset = offset * .71; // .71 - sin and cos for 315
        yOffset = offset * .71;
      }
      //position tooltip
      this.tooltip.classed("vzb-hidden", false)
        //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
        .selectAll("text")
        .text(tooltipText);

      var contentBBox = this.tooltip.select('text')[0][0].getBBox();
      if(x - xOffset - contentBBox.width < 0) {
        xSign = 1;
        x += contentBBox.width + 5; // corrective to the block Radius and text padding
      } else {
        x -= 5; // corrective to the block Radius and text padding
      }
      if(y - yOffset - contentBBox.height < 0) {
        ySign = 1;
        y += contentBBox.height;
      } else {
        y -= 11; // corrective to the block Radius and text padding
      }
      if(offset) {
        xPos = x + xOffset * xSign;
        yPos = y + yOffset * ySign; // 5 and 11 - corrective to the block Radius and text padding
      } else {
        xPos = x + xOffset * xSign; // .71 - sin and cos for 315
        yPos = y + yOffset * ySign; // 5 and 11 - corrective to the block Radius and text padding
      }
      this.tooltip.attr("transform", "translate(" + (xPos ? xPos : mouse[0]) + "," + (yPos ? yPos : mouse[1]) +
        ")")

      this.tooltip.select('rect').attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * .85)
        .attr("rx", contentBBox.height * .2)
        .attr("ry", contentBBox.height * .2);


    } else {

      this.tooltip.classed("vzb-hidden", true);
    }
  }

});


export default BubbleMapComponent;
