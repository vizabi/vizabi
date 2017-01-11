import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import indicatorpicker from 'components/indicatorpicker/indicatorpicker';
import simplecheckbox from 'components/simplecheckbox/simplecheckbox';
/*!
 * VIZABI SIDE CONTROL
 * Reusable side dialog
 */

var Side = Dialog.extend({

  init: function(config, parent) {
    this.name = 'side';
    var _this = this;

    this.model_binds = {
      "change:state.entities_side.show": function(evt) {
        _this.redraw();
      }
    }

    this.components = [
    {
      component: indicatorpicker,
      placeholder: '.vzb-side-selector',
      model: ["state.time", "state.entities_side", "state.marker", "locale"],
      markerID: "hook_side",
      showHoverValues: false
    },
    {
      component: simplecheckbox,
      placeholder: '.vzb-flipsides-switch',
      model: ["ui.chart", "locale"],
      checkbox: 'flipSides',
      //submodel: 'labels'
    }
    ];

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce: function() {
    this._super();
    this.list = this.element.select(".vzb-side-list");
    this.input_search = this.element.select(".vzb-side-search");
    this.deselect_all = this.element.select(".vzb-side-deselect");

    this.KEY = this.model.state.entities_side.getDimension();
    this.TIMEDIM = this.model.state.time.getDimension();

    var _this = this;
    this.input_search.on("input", function() {
      _this.showHideSearch();
    });

    this.deselect_all.on("click", function() {
      _this.deselectEntities();
    });


    //make sure it refreshes when all is reloaded
    this.root.on('ready', function() {
      _this.redraw();
    })
  },

  open: function() {
    this._super();

    this.input_search.node().value = "";
    this.showHideSearch();
  },

  ready: function() {
    this._super();
    this.redraw();
    utils.preventAncestorScrolling(this.element.select('.vzb-dialog-scrollable'));

  },

  redraw: function(){

    var _this = this;
    this.translator = this.model.locale.getTFunction();

    this.model.state.marker_allpossibleside.getFrame(this.model.state.time.value, function(values) {
    if(!values) return;
    var data = utils.keys(values.label)
        .map(function(d){
            var result = {};
            result[_this.KEY] = d;
            result["label"] = values.label[d];
            return result;
        });

    //sort data alphabetically
    data.sort(function(a, b) {
      return(a.label < b.label) ? -1 : 1;
    });

      _this.list.html("");

    var items = _this.list.selectAll(".vzb-side-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-side-item vzb-dialog-checkbox")

    items.append("input")
      .attr("type", "checkbox")
      .attr("class", "vzb-side-item")
      .attr("id", function(d) {
        return "-side-" + d[_this.KEY] + "-" + _this._id;
      })
      .property("checked", function(d) {
        return _this.model.state.entities_side.isShown(d);
      })
      .on("change", function(d) {

        _this.model.state.marker.clearSelected();
        _this.model.state.entities_side.showEntity(d);
        _this.showHideDeselect();
      });

    items.append("label")
      .attr("for", function(d) {
        return "-side-" + d[_this.KEY] + "-" + _this._id;
      })
      .text(function(d) {
        return d.label;
      });

      _this.input_search.attr("placeholder", _this.translator("placeholder/search") + "...");

      _this.showHideSearch();
      _this.showHideDeselect();

    });
  },

  showHideSearch: function() {

    var search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-side-item")
      .classed("vzb-hidden", function(d) {
        var lower = d.label.toLowerCase();
        return(lower.indexOf(search) === -1);
      });
  },

  showHideDeselect: function() {
    var show = this.model.state.entities_side.show[this.KEY];
    this.deselect_all.classed('vzb-hidden', !show || show.length == 0);
  },

  deselectEntities: function() {
    this.model.state.entities_side.clearShow();
    this.showHideDeselect();
  },

  transitionEnd: function(event) {
    this._super(event);

    if(!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Side;
