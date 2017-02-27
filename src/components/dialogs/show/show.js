import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

/*!
 * VIZABI SHOW CONTROL
 * Reusable show dialog
 */

const Show = Dialog.extend({

  init(config, parent) {
    this.name = "show";
    const _this = this;

    this.model_binds = {
      "change:state.entities.show": function(evt) {
        _this.redraw();
      }
    };

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce() {
    this._super();
    this.list = this.element.select(".vzb-show-list");
    this.input_search = this.element.select(".vzb-show-search");
    this.deselect_all = this.element.select(".vzb-show-deselect");

    this.KEY = this.model.state.entities.getDimension();
    this.TIMEDIM = this.model.state.time.getDimension();

    const _this = this;
    this.input_search.on("input", () => {
      _this.showHideSearch();
    });

    this.deselect_all.on("click", () => {
      _this.deselectEntities();
    });


    //make sure it refreshes when all is reloaded
    this.root.on("ready", () => {
      _this.redraw();
    });
  },

  open() {
    this._super();

    this.input_search.node().value = "";
    this.showHideSearch();
  },

  ready() {
    this._super();
    this.redraw();
    utils.preventAncestorScrolling(this.element.select(".vzb-dialog-scrollable"));

  },

  redraw() {

    const _this = this;
    this.translator = this.model.locale.getTFunction();

    this.model.state.marker_allpossible.getFrame(this.model.state.time.value, values => {
      if (!values) return;
      const data = utils.keys(values.label)
        .map(d => {
          const result = {};
          result[_this.KEY] = d;
          result["label"] = values.label[d];
          return result;
        });

    //sort data alphabetically
      data.sort((a, b) => (a.label < b.label) ? -1 : 1);

      _this.list.html("");

      const items = _this.list.selectAll(".vzb-show-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-show-item vzb-dialog-checkbox");

      items.append("input")
        .attr("type", "checkbox")
        .attr("class", "vzb-show-item")
        .attr("id", d => "-show-" + d[_this.KEY] + "-" + _this._id)
        .property("checked", d => _this.model.state.entities.isShown(d))
        .on("change", d => {

          _this.model.state.marker.clearSelected();
          _this.model.state.entities.showEntity(d);
          _this.showHideDeselect();
        });

      items.append("label")
        .attr("for", d => "-show-" + d[_this.KEY] + "-" + _this._id)
        .text(d => d.label);

      _this.input_search.attr("placeholder", _this.translator("placeholder/search") + "...");

      _this.showHideSearch();
      _this.showHideDeselect();

    });
  },

  showHideSearch() {

    let search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-show-item")
      .classed("vzb-hidden", d => {
        const lower = d.label.toLowerCase();
        return (lower.indexOf(search) === -1);
      });
  },

  showHideDeselect() {
    const show = this.model.state.entities.show[this.KEY];
    this.deselect_all.classed("vzb-hidden", !show || show.length == 0);
  },

  deselectEntities() {
    this.model.state.entities.clearShow();
    this.showHideDeselect();
  },

  transitionEnd(event) {
    this._super(event);

    if (!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Show;
