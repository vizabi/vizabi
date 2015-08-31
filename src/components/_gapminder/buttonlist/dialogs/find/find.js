/*!
 * VIZABI FIND CONTROL
 * Reusable find dialog
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.register('gapminder-buttonlist-find', Dialog.extend({

    init: function (config, parent) {
      this.name = 'find';
      var _this = this;

      this.components = [{
        component: 'gapminder-bubbleopacity',
        placeholder: '.vzb-dialog-bubbleopacity',
        model: ["state.entities"],
        arg: "opacitySelectDim"
      }];

      this.model_binds = {
        "change:state:entities:select": function (evt) {
          _this.ready();
        },
        "change:state:time:value": function (evt) {
          if(!_this.model.state.time.playing) {
            _this.ready();
          }
        }
      }

      this._super(config, parent);
    },

    /**
     * Grab the list div
     */
    readyOnce: function () {
      this.element = d3.select(this.element);
      this.list = this.element.select(".vzb-find-list");
      this.input_search = this.element.select("#vzb-find-search");
      this.deselect_all = this.element.select("#vzb-find-deselect");
      this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

      this.KEY = this.model.state.entities.getDimension();

      var _this = this;
      this.input_search.on("input", function () {
        _this.showHideSearch();
      });

      this.deselect_all.on("click", function () {
        _this.deselectEntities();
      });

      this._super();
    },

    open: function () {
      this._super();

      this.input_search.node().value = "";
      this.input_search.node().focus();
      this.showHideSearch();
    },

    /**
     * Build the list everytime it updates
     */
    //TODO: split update in render and update methods
    ready: function () {
      this._super();

      var _this = this;
      var KEY = this.KEY;
      var TIMEDIM = this.model.state.time.getDimension();
      var selected = this.model.state.entities.getSelected();
      var marker = this.model.state.marker;
      var filter = {};
      filter[TIMEDIM] = this.model.state.time.value;

      var values = marker.getValues(filter, [KEY])

      var data = marker.getKeys().map(function (d) {
        var pointer = {};
        pointer[KEY] = d[KEY];
        pointer.name = values.label[d[KEY]];
        return pointer;
      }).filter(function(d) {
        var include = true;
        utils.forEach(values, function(hook) {
          if(!hook[d[KEY]]) {
            include = false;
            return false;
          }
        });
        return include;
      })

      //sort data alphabetically
      data.sort(function (a, b) {
        return (a.name < b.name) ? -1 : 1;
      });

      this.list.html("");

      var items = this.list.selectAll(".vzb-find-item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "vzb-find-item vzb-dialog-checkbox")

      items.append("input")
        .attr("type", "checkbox")
        .attr("class", "vzb-find-item")
        .attr("id", function (d) {
          return "-find-" + d[KEY];
        })
        .property("checked", function (d) {
          return (selected.indexOf(d[KEY]) !== -1);
        })
        .on("change", function (d) {
          _this.model.state.entities.selectEntity(d);
        });

      items.append("label")
        .attr("for", function (d) {
          return "-find-" + d[KEY];
        })
        .text(function (d) {
          return d.name;
        })
        .on("mouseover", function (d) {
          _this.model.state.entities.highlightEntity(d);
        })
        .on("mouseout", function (d) {
          _this.model.state.entities.clearHighlighted();
        });

      this.showHideSearch();
      this.showHideDeselect();
    },

    showHideSearch: function () {

      var search = this.input_search.node().value || "";
      search = search.toLowerCase();

      this.list.selectAll(".vzb-find-item")
        .classed("vzb-hidden", function (d) {
          var lower = d.name.toLowerCase();
          return (lower.indexOf(search) === -1);
        });
    },

    showHideDeselect: function () {
      var someSelected = !!this.model.state.entities.select.length;
      this.deselect_all.classed('vzb-hidden', !someSelected);
      this.opacity_nonselected.classed('vzb-hidden', !someSelected);
    },

    deselectEntities: function () {
      this.model.state.entities.clearSelected();
    }

  }));


}).call(this);
