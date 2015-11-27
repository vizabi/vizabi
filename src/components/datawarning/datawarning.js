import * as utils from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals';

import {warn as iconWarn, close as iconClose} from 'base/iconset';

var hidden = true;

var DataWarning = Component.extend({

  init: function(config, context) {
    var _this = this;

    this.name = 'gapminder-datawarning';

    this.model_expects = [{
      name: "language",
      type: "language"
    }];

    this.context = context;

    this.model_binds = {
      "change:language:strings": function(evt) {
        _this.ready();
      }
    }

    //contructor is the same as any component
    this._super(config, context);

    this.ui = utils.extend({
      //...add properties here
    }, this.ui);

  },

  ready: function() {},

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.placeholder);
    this.translator = this.model.language.getTFunction();

    this.element.selectAll("div").remove();

    this.element.append("div")
      .attr("class", "vzb-data-warning-background")
      .on("click", function() {
        _this.toggle(true)
      });

    var container = this.element.append("div")
      .attr("class", "vzb-data-warning-box");

    container.append("div")
      .html(iconClose)
      .on("click", function() {
        _this.toggle()
      })
      .select("svg")
      .attr("width", "0px")
      .attr("height", "0px")
      .attr("class", "vzb-data-warning-close");

    var icon = container.append("div")
      .attr("class", "vzb-data-warning-link")
      .html(iconWarn)

    icon.append("div")
      .text("Data doubts");

    if(this.parent.datawarning_content.title) {
      container.append("div")
        .attr("class", "vzb-data-warning-title")
        .html(this.parent.datawarning_content.title);
    }

    container.append("div")
      .attr("class", "vzb-data-warning-body vzb-dialog-scrollable")
      .html(this.parent.datawarning_content.body);

  },

  toggle: function(arg) {
    if(arg == null) arg = !hidden;
    hidden = arg;
    this.element.classed("vzb-hidden", hidden);

    var _this = this;
    this.parent.components.forEach(function(c) {
      c.element.classed("vzb-blur", c != _this && !hidden);
    })
  }

});

export default DataWarning;