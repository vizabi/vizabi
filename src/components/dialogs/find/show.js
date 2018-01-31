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

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce() {
    this._super();

    this.KEYS = utils.unique(this.model.state.marker._getAllDimensions({ exceptType: "time" }));

    this.resetFilter = {};
    const spaceModels = this.model.state.marker._space;
    this.KEYS.forEach(key => {
      this.resetFilter[key] = utils.find(spaceModels, model => model.dim === key).show;
    });
    
    this.parentElement = d3.select(this.parent.element);
    this.contentEl = this.element = d3.select(this.element.parentNode);

    this.list = this.element.select(".vzb-show-list");
    this.input_search = this.parentElement.select(".vzb-find-search");
    this.deselect_all = this.parentElement.select(".vzb-show-deselect");
    this.apply = this.parentElement.select(".vzb-show-apply");

    const _this = this;

    this.deselect_all.on("click", () => {
      _this.resetShow();
    });

    this.apply.on("click", () => {
      _this.applyShowChanges();
    });

    //make sure it refreshes when all is reloaded
    this.root.on("ready", () => {
      _this.redraw();
    });
  },

  ready() {
    this._super();
    this.KEYS = utils.unique(this.model.state.marker._getAllDimensions({ exceptType: "time" }));
    this.labelNames = this.model.state.marker.getLabelHookNames();
    const subHooks =  this.model.state.marker.getSubhooks(true);
    this.previewShow = {};
    utils.forEach(this.labelNames, labelName => {
      this.previewShow[subHooks[labelName].getEntity()._name] = {};
    });
    this.redraw();
    this.showHideButtons();

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
            const result = { entities, category: key };
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
            if (!this.previewShow[d.entities][d.category]) {
              const show = _this.model.state[d.entities].show;
              this.previewShow[d.entities][d.category] = ((show[d.category] || ((show.$and || {})[d.category] || {})).$in || []).slice(0);
            }
            const index = this.previewShow[d.entities][d.category].indexOf(d[d.category]);
            index === -1 ? this.previewShow[d.entities][d.category].push(d[d.category]) : this.previewShow[d.entities][d.category].splice(index, 1);
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

    });
  },

  applyShowChanges() {
    this.model.state.marker.clearSelected();

    const setObj = {};
    utils.forEach(this.previewShow, (showObj, entities) => {
      const $and = [];
      utils.forEach(showObj, (entitiesArray, category) => {
        $and.push({ [category]: entitiesArray.length ? { $in: entitiesArray } : {} });
      });
      if (!$and.length) return;
      setObj[entities] = { show: $and.length > 1 ? { $and } : $and[0] };
    });
    this.model.state.set(setObj);
  },

  showHideSearch() {

    let search = this.input_search.node().value || "";
    search = search.toLowerCase();
    this.list.selectAll(".vzb-accordion-section")
      .classed("vzb-accordion-active", true);
    this.list.selectAll(".vzb-show-item")
      .classed("vzb-hidden", d => {
        const lower = (d.label || "").toString().toLowerCase();
        return (lower.indexOf(search) === -1);
      });
  },
 
  showHideButtons() {
    this.deselect_all.classed("vzb-hidden", this.hideResetButton());
    //
    this.apply.classed("vzb-hidden", false);
  },

  hideResetButton() {
    let showEquals = true;
    const spaceModels = this.model.state.marker._space;
    utils.forEach(this.KEYS, key => {
      showEquals = utils.comparePlainObjects(this.resetFilter[key] || {}, utils.find(spaceModels, model => model.dim === key).show);
      return showEquals;
    });
    
    return showEquals;
  },

  resetShow() {
    const setProps = {};
    const spaceModels = this.model.state.marker._space;
    this.KEYS.forEach(key => {
      const entities = utils.find(spaceModels, model => model.dim === key)._name;
      setProps[entities] = { show: this.resetFilter[key] || {} };
    });
    this.model.state.set(setProps);
  },

});

export default Show;
