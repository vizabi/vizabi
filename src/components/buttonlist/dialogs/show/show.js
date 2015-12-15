import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';
import globals from 'base/globals';

import { bubbleopacity } from 'components/_index'

/*!
 * VIZABI SHOW CONTROL
 * Reusable show dialog
 */

var Show = Dialog.extend({

  init: function(config, parent) {
    this.name = 'show';
    var _this = this;

    this.model_binds = {
      "change:state.entities.show": function(evt) {
        _this.redraw();
      }
    }

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce: function() {
    this._super();
    this.list = this.element.select(".vzb-show-list");
    this.input_search = this.element.select("#vzb-show-search");
    this.deselect_all = this.element.select("#vzb-show-deselect");

    this.KEY = this.model.state.entities.getDimension();
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
    this.translator = this.model.language.getTFunction();

    var filter = {};
    filter[this.TIMEDIM] = this.model.state.time.value;

    var values = this.model.state.marker.getValues(filter, [this.KEY])

    var data = globals.metadata.entities;

    //sort data alphabetically
    data.sort(function(a, b) {
      return(a.name < b.name) ? -1 : 1;
    });

    this.list.html("");

    var items = this.list.selectAll(".vzb-show-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-show-item vzb-dialog-checkbox")

    items.append("input")
      .attr("type", "checkbox")
      .attr("class", "vzb-show-item")
      .attr("id", function(d) {
        return "-show-" + d[_this.KEY];
      })
      .property("checked", function(d) {
        return _this.model.state.entities.isShown(d);
      })
      .on("change", function(d) {
        _this.model.state.entities.showEntity(d);
        _this.showHideDeselect();
      });

    items.append("label")
      .attr("for", function(d) {
        return "-show-" + d[_this.KEY];
      })
      .text(function(d) {
        return d.name;
      });

    this.input_search.attr("placeholder", this.translator("placeholder/search") + "...");

    this.showHideSearch();
    this.showHideDeselect();


  },

  showHideSearch: function() {

    var search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-show-item")
      .classed("vzb-hidden", function(d) {
        var lower = d.name.toLowerCase();
        return(lower.indexOf(search) === -1);
      });
  },

  showHideDeselect: function() {
    var show = this.model.state.entities.show[this.KEY];
    this.deselect_all.classed('vzb-hidden', show[0]==="*");
  },

  deselectEntities: function() {
    this.model.state.entities.clearShow();
    this.showHideDeselect();
  },

  transitionEnd: function(event) {
    this._super(event);

    if(!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Show;
