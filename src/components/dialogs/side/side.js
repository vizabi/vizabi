import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import indicatorpicker from "components/indicatorpicker/indicatorpicker";
import simplecheckbox from "components/simplecheckbox/simplecheckbox";
/*!
 * VIZABI SIDE CONTROL
 * Reusable side dialog
 */

const Side = Dialog.extend("side", {

  init(config, parent) {
    this.name = "side";
    const _this = this;

    this.model_binds = {
      "change:ui.chart.flipSides": function(evt) {
        if (!_this._readyOnce) return;
        _this.updateState();
        _this.redraw();
      }

    };

    this.components = [
      {
        component: indicatorpicker,
        placeholder: ".vzb-side-selector",
        model: ["state.time", "state.marker.side", "locale"],
        showHoverValues: false
      }
    ];

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce() {
    this._super();
    this.listLeft = this.element.select(".vzb-side-list-left");
    this.listRight = this.element.select(".vzb-side-list-right");
    this.switchSides = this.element.select(".vzb-side-switch-sides");

    this.TIMEDIM = this.model.state.time.getDimension();
    this.state = {};
    const _this = this;

    this.switchSides.on("click", () => {
      _this.model.ui.chart.flipSides = !_this.model.ui.chart.flipSides;
    });

    this.model.state.marker.side.getEntity().on("change:show", () => {
      _this.updateState();
      _this.redraw();
    });

    //make sure it refreshes when all is reloaded
    this.root.on("ready", () => {
      _this.redraw();
    });
  },

  ready() {
    this._super();

    const sideEntities = this.model.state.marker.side.getEntity();
    this.KEY = sideEntities.getDimension();
    this.labelNames = this.model.state.marker.getLabelHookNames();
    if (this.model.state.marker.side.use !== "constant" && !(sideEntities.show[this.KEY] || {})["$in"]) {
      const sideKeys = this.model.state.marker.side.getUnique(this.model.state.marker.side.which).filter(f => f !== null);
      const filterKeys = sideKeys.sort(d3.ascending).slice(0, 2);
      if (filterKeys.length > 0) {
        const show = Object.assign({}, sideEntities.show);
        show[this.KEY] = { "$in": filterKeys };
        sideEntities.set("show", show);
      }
    }

    this.updateState();
    this.redraw();
    utils.preventAncestorScrolling(this.element.select(".vzb-dialog-scrollable"));

  },

  updateState() {
    const _this = this;
    const sideDim = this.model.state.marker.side.getEntity().getDimension();
    const modelSide = this.model.state.marker.side;

    this.state["right"] = {};
    this.state["left"] = {};
    if (modelSide.state["left"][sideDim] && modelSide.state["right"][sideDim]) {
      this.state["left"][sideDim] = modelSide.state["left"][sideDim];
      this.state["right"][sideDim] = modelSide.state["right"][sideDim];
    } else {
      const sides = this.model.state.marker.getKeys(sideDim);
      let sideKeys = [];
      const sideFiltered = !!this.model.state.marker.side.getEntity().show[sideDim];
      sideKeys = sides.filter(f => !sideFiltered || _this.model.state.marker.side.getEntity().isShown(f)).map(m => m[sideDim]);

      if (sideKeys.length > 2) sideKeys.length = 2;
      if (sideKeys.length > 1) {
        const sortFunc = this.ui.chart.flipSides ? d3.ascending : d3.descending;
        sideKeys.sort(sortFunc);
      }

      this.state["right"] = {};
      this.state["right"][sideDim] = sideKeys[0];
      this.state["left"] = {};
      this.state["left"][sideDim] = sideKeys[1] ? sideKeys[1] : sideKeys[0];
    }

    const hidden = this.model.state.marker.side.use == "constant";

    this.listLeft.classed("vzb-hidden", hidden);
    this.listRight.classed("vzb-hidden", hidden);
    this.switchSides.classed("vzb-hidden", hidden || this.state["left"][sideDim] == this.state["right"][sideDim]);
  },

  redraw() {

    const _this = this;
    const labelNames = this.labelNames;
    const KEY = this.KEY;

    this.translator = this.model.locale.getTFunction();

    if (!_this.model.state.marker.side.getEntity().dim) return;

    this.model.state.marker.getFrame(this.model.state.time.value, values => {
      if (!values) return;
      const data = [];
      const sideConcept = _this.model.state.marker.side.getConceptprops();

      if (sideConcept.concept_type == "entity_set") {
        data.push(..._this.model.state.marker.side.getEntity().getEntitySets("data")[sideConcept.concept][0].map(d => {
          const result = {};
          result[KEY] = d[sideConcept.concept];
          result["label"] = d["name"];
          return result;
        }));
      } else {
        utils.forEach(values[labelNames[KEY]], (value, key) => {
          const result = {};
          result[KEY] = key;
          result["label"] = value;
          data.push(result);
        });
      }

      //sort data alphabetically
      data.sort((a, b) => (a.label < b.label) ? -1 : 1);

      _this.listLeft.html("");
      _this.listRight.html("");
      _this.createList(_this.listLeft, "left", data);
      _this.createList(_this.listRight, "right", data);

    });
  },

  createList(listSel, name, data) {
    const _this = this;
    const sideDim = this.model.state.marker.side.getEntity().getDimension();

    const items = listSel.selectAll(".vzb-side-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-side-item vzb-dialog-radio");

    items.append("input")
      .attr("type", "radio")
      .attr("name", name + "-" + _this._id)
      .attr("class", "vzb-side-item")
      .attr("id", d => "-side-" + name + "-" + d[sideDim] + "-" + _this._id)
      .property("checked", d => _this.state[name][sideDim] === d[sideDim])
      .on("change", (d, i) => {
        const sideEntities = _this.model.state.marker.side.getEntity();
        const sideDim = sideEntities.getDimension();
        const otherSide = name == "left" ? "right" : "left";
        const modelSide = _this.model.state.marker.side;

        modelSide.state[name][sideDim] = d[sideDim];
        modelSide.state[otherSide][sideDim] = _this.state[otherSide][sideDim];

        const showArray = [];

        if (!sideEntities.isShown(d)) {
          showArray.push(d);
        }
        if (d[sideDim] !== _this.state[otherSide][sideDim] && !sideEntities.isShown(_this.state[otherSide])) {
          showArray.push(_this.state[otherSide]);
        }
        if (_this.state[name][sideDim] !== _this.state[otherSide][sideDim] && sideEntities.isShown(_this.state[name])) {
          showArray.push(_this.state[name]);
        }

        if (d[sideDim] !== _this.state[otherSide][sideDim]) {
          const sideKeys = [d[sideDim], _this.state[otherSide][sideDim]];
          const sortFunc = _this.ui.chart.flipSides ? d3.ascending : d3.descending;
          sideKeys.sort(sortFunc);
          if (sideKeys[name == "left" ? 0 : 1] == d[sideDim]) {
            _this.model.state.marker.side.switchSideState();
            _this.ui.chart.flipSides = !_this.ui.chart.flipSides;
          }
        }

        if (showArray.length) {
          sideEntities.showEntity(showArray);
        }

      });

    items.append("label")
      .attr("for", d => "-side-" + name + "-" + d[_this.KEY] + "-" + _this._id)
      .text(d => d.label);
  }

});

export default Side;
