import * as utils from "base/utils";
import Component from "base/component";

import { close as iconClose } from "base/iconset";

let hidden = true;
let showNotes = false;
let pin = false;
let left = 0;
let top = 0;
let hookName = null;
let newHookName = null;

const DataNotes = Component.extend({

  init(config, context) {
    const _this = this;

    this.name = "gapminder-datanotes";

    this.model_expects = [{
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }];

    this.context = context;

    this.model_binds = {
      "translate:locale": function(evt) {
        if (!_this._ready || !_this._readyOnce) return;
        _this.ready();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

    this.close = this.close.bind(this);
  },

  ready() {
    this.setValues();
  },

  readyOnce() {
    const _this = this;

    this.translator = this.model.locale.getTFunction();
    this.element = d3.select(this.placeholder);

    this.element.selectAll("div").remove();

    const container = this.element;

    container.append("div")
      .html(iconClose)
      .on("click", () => {
        d3.event.stopPropagation();
        _this.close();
      })
      .select("svg")
      .attr("width", "0px")
      .attr("height", "0px")
      .attr("class", "vzb-data-notes-close")
      .classed("vzb-hidden", true);

    container.append("div")
      .attr("class", "vzb-data-notes-body vzb-dialog-scrollable");

    container.append("div")
      .attr("class", "vzb-data-notes-link");

  },

  resize() {
    this.close();
  },

  close() {
    if (!hidden) {
      this.pin(false).hide();
    }
  },

  setHook(_hookName) {
    if (!this._readyOnce) return this;
    if (pin) {
      newHookName = _hookName;
      return this;
    }
    if (hookName) this.model.marker[hookName].off("change:which", this.close);
    hookName = newHookName = _hookName;
    this.model.marker[hookName].on("change:which", this.close);

    this.setValues();

    return this;
  },

  setValues() {
    if (!hookName) return;
    const hook = this.model.marker[hookName];
    const concept = hook.getConceptprops();

    this.element.select(".vzb-data-notes-body")
      .classed("vzb-hidden", !concept.description)
      .text(concept.description || "");

    this.element.select(".vzb-data-notes-link").classed("vzb-hidden", !concept.sourceLink);

    if (concept.sourceLink) {
      const _source = this.translator("hints/source");
      const sourceName = concept.sourceName || "";
      this.element.select(".vzb-data-notes-link").html("<span>" + (sourceName ? (_source + ":") : "") +
        '<a href="' + concept.sourceLink + '" target="_blank">' + (sourceName ? sourceName : _source) + "</a></span>");
    }
    showNotes = concept.sourceLink || concept.description;
  },

  setPos(_left, _top, force) {
    left = _left;
    top = _top;
    if (pin && !force) return this;
    const parentHeight = this.parent.element.offsetHeight;
    const width = this.element.node().offsetWidth;
    const height = this.element.node().offsetHeight;
    let leftMove;
    let topMove;
    let leftPos = left - width;
    let topPos = top;
    if (leftPos < 10) {
      leftPos = 10;
      leftMove = true;
    }
    if ((topPos + height + 10) > parentHeight) {
      topPos = parentHeight - height - 10;
      topMove = true;
    }

    if (leftMove && topMove) {
      topPos = top - height - 30;
    }

    this.element.style("top", topPos + "px");
    this.element.style("left", leftPos + "px");

    return this;
  },

  pin(arg) {
    if (hidden) return this;
    pin = !pin;
    if (arg != null) pin = arg;
    this.element.select(".vzb-data-notes-close").classed("vzb-hidden", !pin);
    this.element.classed("vzb-data-notes-pinned", pin);
    if (hookName != newHookName) this.setHook(newHookName);
    this.element.select(".vzb-data-notes-body").node().scrollTop = 0;

    return showNotes ?
      this.setPos(left, top, true) :
      this.hide();
  },

  toggle(arg) {
    if (pin || !hookName) return this;
    if (arg == null) arg = !hidden;
    hidden = arg;
    this.element.classed("vzb-hidden", hidden || !showNotes);
    return this;
  },

  show() {
    return this.toggle(false);
  },

  hide() {
    return this.toggle(true);
  }

});

export default DataNotes;
