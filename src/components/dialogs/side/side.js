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
      "change:state.marker.side.which": function(evt) {
        if(_this.model.state.entities_allpossibleside) {
          var sideDim = _this.model.state.marker.side.use == "constant" ? null : _this.model.state.marker.side.which;
          _this.model.state.entities_allpossibleside.set("dim", sideDim);
        }
      },
      "change:state.entities_side.show": function(evt) {
        if (!_this._readyOnce) return;
        _this.updateState();
        _this.redraw();
      },
      "change:ui.chart.flipSides": function (evt) {
        if (!_this._readyOnce) return;
        _this.updateState();
        _this.redraw();
      }

    };

    this.components = [
    {
      component: indicatorpicker,
      placeholder: '.vzb-side-selector',
      model: ["state.time", "state.entities_side", "state.marker", "locale"],
      markerID: "side",
      showHoverValues: false
    }
    ];

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce: function() {
    this._super();
    this.listLeft = this.element.select(".vzb-side-list-left");
    this.listRight = this.element.select(".vzb-side-list-right");
    this.switchSides = this.element.select(".vzb-side-switch-sides");

    this.TIMEDIM = this.model.state.time.getDimension();
    this.state = {};
    var _this = this;

    this.switchSides.on("click", function() {
      _this.model.ui.chart.flipSides = !_this.model.ui.chart.flipSides;
    });

    //make sure it refreshes when all is reloaded
    this.root.on('ready', function() {
      _this.redraw();
    });
  },

  ready: function() {
    this._super();

    this.KEY = this.model.state.entities_side.getDimension();
    this.updateState();
    this.redraw();
    utils.preventAncestorScrolling(this.element.select('.vzb-dialog-scrollable'));

  },

  updateState: function() {
    var _this = this;
    var sideDim = this.model.state.marker.side.getEntity().getDimension();
    var modelSide = this.model.state.marker.side;

    this.state["right"] = {};
    this.state["left"] = {};
    if(modelSide.state["left"][sideDim] && modelSide.state["right"][sideDim]) {
      this.state["left"][sideDim] = modelSide.state["left"][sideDim];
      this.state["right"][sideDim] = modelSide.state["right"][sideDim];
    } else {
      var sides = this.model.state.marker.getKeys(sideDim);
      var sideKeys = [];
      var sideFiltered = !!this.model.state.marker.side.getEntity().show[sideDim];
      sideKeys = sides.filter(f => !sideFiltered || _this.model.state.marker.side.getEntity().isShown(f)).map(function(m) {
          return m[sideDim];
        });

      if(sideKeys.length > 2) sideKeys.length = 2;
      if(sideKeys.length > 1) {
        var sortFunc = this.ui.chart.flipSides ? d3.ascending : d3.descending;
        sideKeys.sort(sortFunc);
      }

      this.state["right"] = {};
      this.state["right"][sideDim] = sideKeys[0];
      this.state["left"] = {};
      this.state["left"][sideDim] = sideKeys[1] ? sideKeys[1] : sideKeys[0];
    }

    var hidden = this.model.state.marker.side.use == "constant";

    this.listLeft.classed("vzb-hidden", hidden);
    this.listRight.classed("vzb-hidden", hidden);
    this.switchSides.classed("vzb-hidden", hidden || this.state["left"][sideDim] == this.state["right"][sideDim]);
  },

  redraw: function() {

    var _this = this;
    this.translator = this.model.locale.getTFunction();

    if(!_this.model.state.entities_allpossibleside.dim) return;
    this.model.state.marker_allpossibleside.getFrame(this.model.state.time.value, function(values) {
    if(!values) return;
    var data = utils.keys(values.label)
        .map(function(d) {
            var result = {};
            result[_this.KEY] = d;
            result["label"] = values.label[d];
            return result;
        });

    //sort data alphabetically
    data.sort(function(a, b) {
      return(a.label < b.label) ? -1 : 1;
    });

    _this.listLeft.html("");
    _this.listRight.html("");
    _this.createList(_this.listLeft, "left", data);
    _this.createList(_this.listRight, "right", data);

    });
  },

  createList: function(listSel, name, data) {
    var _this = this;
    var sideDim = this.model.state.marker.side.getEntity().getDimension();

    var items = listSel.selectAll(".vzb-side-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-side-item vzb-dialog-radio");

    items.append("input")
      .attr("type", "radio")
      .attr("name", name + "-" + _this._id)
      .attr("class", "vzb-side-item")
      .attr("id", function(d) {
        return "-side-" + name + "-" + d[sideDim] + "-" + _this._id;
      })
      .property("checked", function(d) {
        return _this.state[name][sideDim] === d[sideDim];
      })
      .on("change", function(d, i) {
        var sideEntities = _this.model.state.entities_side;
        var sideDim = sideEntities.getDimension();
        var otherSide = name == "left" ? "right" : "left";
        var modelSide = _this.model.state.marker.side;

        modelSide.state[name][sideDim] = d[sideDim];
        modelSide.state[otherSide][sideDim] = _this.state[otherSide][sideDim];

        var showArray = [];

        if(!sideEntities.isShown(d)) {
          showArray.push(d);
        }
        if(d[sideDim] !== _this.state[otherSide][sideDim] && !sideEntities.isShown(_this.state[otherSide])) {
          showArray.push(_this.state[otherSide]);
        }
        if(_this.state[name][sideDim] !== _this.state[otherSide][sideDim] && sideEntities.isShown(_this.state[name])) {
          showArray.push(_this.state[name]);
        }

        if(d[sideDim] !== _this.state[otherSide][sideDim]) {
          var sideKeys = [d[sideDim], _this.state[otherSide][sideDim]];
          var sortFunc = _this.ui.chart.flipSides ? d3.ascending : d3.descending;
          sideKeys.sort(sortFunc);
          if(sideKeys[name == "left" ? 0 : 1] == d[sideDim]) {
            _this.model.state.marker.side.switchSideState();
            _this.ui.chart.flipSides = !_this.ui.chart.flipSides;
          }
        }

        if(showArray.length) {
          sideEntities.showEntity(showArray);
        }

      });

    items.append("label")
      .attr("for", function(d) {
        return "-side-" + name + "-" + d[_this.KEY] + "-" + _this._id;
      })
      .text(function(d) {
        return d.label;
      });
  }

});

export default Side;
