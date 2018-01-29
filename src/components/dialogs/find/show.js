import * as utils from "base/utils";
import Component from "base/component";

/*!
 * VIZABI SHOW PANEL CONTROL
 * Reusable show panel dialog
 */

const Show = Component.extend({

  init(config, parent) {
    this.name = "show";
    const _this = this;

    this.template = this.template || require("./show.html");

    this.model_expects = this.model_expects ||
    [{
      name: "state"
    }, {
      name: "locale",
      type: "locale"
    }];

    // this.model_binds = {
    //   "change:state.entities.show": function(evt) {
    //     _this.redraw();
    //   }
    // };

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce() {
    this._super();

    this.resetFilter = utils.deepExtend({}, this.model.state.entities.show);

    this.parentElement = d3.select(this.parent.element);
    this.contentEl = this.element = d3.select(this.element.parentNode);
    this.element.select(".vzb-show-filter-selector").classed("vzb-hidden", !this.enablePicker);
    this.element.select(".vzb-dialog-title").classed("vzb-title-two-rows", this.enablePicker);

    this.list = this.element.select(".vzb-show-list");
    this.input_search = this.parentElement.select(".vzb-find-search");
    this.deselect_all = this.parentElement.select(".vzb-show-deselect");
    this.apply = this.parentElement.select(".vzb-show-apply");

    const _this = this;
    // this.input_search.on("input", () => {
    //   _this.showHideSearch();
    // });

    // d3.select(this.input_search.node().parentNode).on("reset", () => {
    //   utils.defer(() => _this.showHideSearch());
    // });

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
    this.labelNames = this.model.state.marker.getLabelHookNames();
    this.redraw();
    utils.preventAncestorScrolling(this.element.select(".vzb-dialog-scrollable"));

  },

  redraw() {

    const _this = this;
    this.translator = this.model.locale.getTFunction();

    this.model.state.marker.getFrame(this.model.state.time.value, values => {
      if (!values) return;

      const subHooks =  this.model.state.marker.getSubhooks(true);

      _this.list.html("");

      utils.forEach(this.labelNames, (labelName, key) => {

        const entities = subHooks[labelName].getEntity()._name;
        const category = _this.root.model.dataManager.getConceptProperty(key, "name");

        const data = utils.keys(values[labelName])
          .map(d => {
            const result = { entities };
            result[key] = d;
            result["label"] = values[labelName][d];
            return result;
          });

        //sort data alphabetically
        data.sort((a, b) => (a.label < b.label) ? -1 : 1);

        const section = _this.list.append("div")
          .attr("class", "vzb-accordion-section");

        section.append("div")
          .attr("class", "vzb-accordion-section-title")
          .on("click", function(d) {
            const parentEl = d3.select(this.parentNode);
            parentEl.classed("vzb-accordion-active", !parentEl.classed("vzb-accordion-active"));
          })
          .append("span")
          .attr("class", "vzb-show-category")
          .text(category);

        const list = section.append("div")
          .attr("class", "vzb-show-category-list");

        const items = list.selectAll(".vzb-show-item")
          .data(data)
          .enter()
          .append("div")
          .attr("class", "vzb-show-item vzb-dialog-checkbox");

        items.append("input")
          .attr("type", "checkbox")
          .attr("class", "vzb-show-item")
          .attr("id", d => "-show-" + d[key] + "-" + _this._id)
          .property("checked", function(d) {
            const isShown = _this.model.state[d.entities].isShown(d);
            d3.select(this.parentNode).classed("vzb-checked", isShown);
            return isShown;
          })
          .on("change", d => {
            _this.model.state.marker.clearSelected();

            _this.model.state[d.entities].showEntity(d);
            _this.showHideButtons();
          });

        items.append("label")
          .attr("for", d => "-show-" + d[key] + "-" + _this._id)
          .text(d => d.label)
          .attr("title", function(d) {
            return this.offsetWidth < this.scrollWidth ? d.label : null;
          });

        const lastCheckedNode = list.selectAll(".vzb-checked")
          .classed("vzb-separator", false)
          .lower()
          .nodes()[0];
        d3.select(lastCheckedNode).classed("vzb-separator", true);
      });

      _this.contentEl.node().scrollTop = 0;

      _this.input_search.attr("placeholder", _this.translator("placeholder/search") + "...");

      // _this.showHideSearch();
      // _this.showHideButtons();

    });
  },

  applyShowChanges() {
  },

  showHideSearch() {

    let search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-show-item")
      .classed("vzb-hidden", d => {
        const lower = (d.label || "").toString().toLowerCase();
        return (lower.indexOf(search) === -1);
      });
  },

  showHideButtons() {
    //const show = this.model.state.entities.show[this.KEY];
    this.deselect_all.classed("vzb-hidden", true);//!show || show.length == 0);
    //
    this.apply.classed("vzb-hidden", true);
  },

  deselectEntities() {
    // const KEY = this.KEY;
    // if (this.resetFilter[KEY]) {
    //   const newShow = Object.assign({}, this.model.state.entities.show);
    //   newShow[KEY] = this.resetFilter[KEY];
    //   this.model.state.entities.show = newShow;
    // } else {
    //   this.model.state.entities.clearShow();
    // }
    // this.showHideButtons();
  },

});

export default Show;
