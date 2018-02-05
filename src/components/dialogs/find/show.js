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
      _this.ready();
    });
  },

  ready() {
    this._super();
    this.KEYS = utils.unique(this.model.state.marker._getAllDimensions({ exceptType: "time" }));
    this.labelNames = this.model.state.marker.getLabelHookNames();
    const subHooks =  this.model.state.marker.getSubhooks(true);
    this.previewShow = {};
    utils.forEach(this.labelNames, labelName => {
      const entities = subHooks[labelName].getEntity();
      const showFilter = this.previewShow[entities._name] = {};
      utils.forEach(entities.show.$and || [entities.show], show$and => {
        utils.forEach(show$and, (filter, key) => {
          showFilter[key] = (filter.$in || []).slice(0);
        });
      });
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

      const categories = [];
      const loadPromises = [];
      utils.forEach(this.labelNames, (labelName, dim) => {
        const entitiesModel = subHooks[labelName].getEntity();
        const entities = entitiesModel._name;

        categories.push({ dim, entities, labelName,
          key: dim,
          category: this.root.model.dataManager.getConceptProperty(dim, "name")
        });

        const entitySetData = entitiesModel._entitySets[dim]
          .map((key, index) => ({
            entities,
            key,
            dim,
            index,
            isSet: true,
            category: this.root.model.dataManager.getConceptProperty(key, "name")
          }));

        categories.push(...entitySetData);
      });

      utils.forEach(categories, ({ dim, key, category, labelName, entities, isSet, index }) => {

        const data = isSet ?
          this.model.state[entities]._entitySetsData[index][0].map(d => {
            const result = { entities, category: key };
            result[key] = d[key];
            result["label"] = d.name;
            return result;
          })
          :
          utils.keys(values[labelName])
            .map(d => {
              const result = { entities, category: key };
              result[key] = d;
              result["label"] = values[labelName][d];
              return result;
            });

        //sort data alphabetically
        data.sort((a, b) => (a.label < b.label) ? -1 : 1);

        const section = _this.list.append("div")
          .attr("class", "vzb-accordion-section")
          .datum({ key, isSet });

        section.append("div")
          .attr("class", "vzb-accordion-section-title")
          .on("click", function(d) {
            const parentEl = d3.select(this.parentNode);
            parentEl.classed("vzb-accordion-active", !parentEl.classed("vzb-accordion-active"));
          })
          .call(elem => elem.append("span")
            .attr("class", "vzb-show-category")
            .text(d => (d.isSet ? "➥ " : "") + category))
          .call(elem => elem.append("span")
            .attr("class", "vzb-show-clear-cross")
            .text("✖")
            .on("click", () => {
              d3.event.stopPropagation();
              section.selectAll(".vzb-checked input")
                .dispatch("change")
                .property("checked", false);
            })
          );

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
            const isShown = _this.model.state[d.entities].isInShowFilter(d, d.category);
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
          // .each(function() {
          //   this.parentNode.insertBefore(this, items.nodes()[0]);
          // })
          .nodes()[0];
        const lastCheckedEl = d3.select(lastCheckedNode).classed("vzb-separator", true);

        if (lastCheckedNode) {
          const maxHeight = lastCheckedNode.parentNode.offsetTop + lastCheckedNode.offsetTop + lastCheckedNode.offsetHeight + 5;
          d3.select(lastCheckedNode.parentNode.parentNode).style("max-height", maxHeight + "px");
        } else {
          section.select(".vzb-show-clear-cross").classed("vzb-hidden", true);
        }

        // section.append("span")
        //   .on("click", (d) => {
        //     const data = this.root.model.dataManager.getAvailableDataForKey1(d.key, null, "entities")
        //       .filter(d => ["entity_set", "entity_domain"].includes(this.root.model.dataManager.getConceptProperty(d.value, "concept_type")))
        //   })
        //   .text("add filter ⮿");
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
      const $andKeys = [];
      utils.forEach(showObj, (entitiesArray, category) => {
        $andKeys.push(category);
        $and.push({ [category]: entitiesArray.length ? { $in: entitiesArray } : {} });
      });
      if (!$and.length) return;

      utils.forEach(this.model.state[entities].show.$and || [this.model.state[entities].show], show$and => {
        utils.forEach(show$and, (filter, key) => {
          if (!$andKeys.includes(key)) {
            $and.push(utils.deepClone(filter));
          }
        });
      });

      setObj[entities] = { show: $and.length > 1 ? { $and } : $and[0] };
    });
    this.model.state.set(setObj);
  },

  showHideSearch() {
    if (this.parent.getPanelMode() !== "show") return;

    let search = this.input_search.node().value || "";
    search = search.toLowerCase();
    this.list.selectAll(".vzb-show-item")
      .classed("vzb-hidden", d => {
        const lower = (d.label || "").toString().toLowerCase();
        return (lower.indexOf(search) === -1);
      });

    if (search !== "") {
      this.list.selectAll(".vzb-accordion-section")
        .classed("vzb-accordion-active", true);
    }
  },

  showHideButtons() {
    if (this.parent.getPanelMode() !== "show") return;

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
