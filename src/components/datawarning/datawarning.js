import * as utils from "base/utils";
import Component from "base/component";

import { warn as iconWarn, close as iconClose } from "base/iconset";

let hidden = true;

const DataWarning = Component.extend({

  init(config, context) {
    const _this = this;

    this.name = "gapminder-datawarning";

    this.model_expects = [{
      name: "locale",
      type: "locale"
    }];

    this.context = context;

    this.model_binds = {
      "translate:locale": function(evt) {
        if (!_this._ready) return;
        _this.redraw();
      }
    };

    //contructor is the same as any component
    this._super(config, context);
  },

  ready() {
    this.redraw();
  },

  readyOnce() {
    const _this = this;
    this.element = d3.select(this.placeholder);

    this.element.selectAll("div").remove();

    this.element.append("div")
      .attr("class", "vzb-data-warning-background")
      .on("click", () => {
        _this.toggle(true);
      });

    this.container = this.element.append("div")
      .attr("class", "vzb-data-warning-box");

    this.container.append("div")
      .html(iconClose)
      .on("click", () => {
        _this.toggle();
      })
      .select("svg")
      .attr("width", "0px")
      .attr("height", "0px")
      .attr("class", "vzb-data-warning-close");

    const icon = this.container.append("div")
      .attr("class", "vzb-data-warning-link")
      .html(iconWarn);

    icon.append("div");

    this.container.append("div")
      .attr("class", "vzb-data-warning-title");

    this.container.append("div")
      .attr("class", "vzb-data-warning-body vzb-dialog-scrollable");
  },

  redraw() {
    this.translator = this.model.locale.getTFunction();

    this.container.select(".vzb-data-warning-link div")
      .text(this.translator("hints/dataWarning"));

    const title = this.translator("datawarning/title/" + this.parent.name);
    this.container.select(".vzb-data-warning-title")
      .html(title)
      .classed("vzb-hidden", !title || title == ("datawarning/title/" + this.parent.name));

    this.container.select(".vzb-data-warning-body")
      .html(this.translator("datawarning/body/" + this.parent.name));
  },

  toggle(arg) {
    if (arg == null) arg = !hidden;
    hidden = arg;
    this.element.classed("vzb-hidden", hidden);

    const _this = this;
    this.parent.components.forEach(c => {
      c.element.classed("vzb-blur", c != _this && !hidden);
    });
  }

});

export default DataWarning;
