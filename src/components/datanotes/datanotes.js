import * as utils from 'base/utils';
import Component from 'base/component';

import {close as iconClose} from 'base/iconset';

var hidden = true;
var showNotes = false;
var pin = false;
var left = 0;
var top = 0;
var hookName = null;
var newHookName = null;

var DataNotes = Component.extend({

  init: function(config, context) {
    var _this = this;

    this.name = 'gapminder-datanotes';

    this.model_expects = [{
      name: "marker",
      type: "model"
    },{
      name: "locale",
      type: "locale"
    }];

    this.context = context;

    this.model_binds = {
      "translate:locale": function(evt) {
        _this.ready();
      }
    }

    //contructor is the same as any component
    this._super(config, context);

    this.close = this.close.bind(this);
  },

  ready: function() {
    this.setValues();
  },

  readyOnce: function() {
    var _this = this;

    this.translator = this.model.locale.getTFunction();
    this.element = d3.select(this.placeholder);

    this.element.selectAll("div").remove();

    var container = this.element;

    container.append("div")
      .html(iconClose)
      .on("click", function() {
        d3.event.stopPropagation();
        _this.close();
      })
      .select("svg")
      .attr("width", "0px")
      .attr("height", "0px")
      .attr("class", "vzb-data-notes-close")
      .classed('vzb-hidden', true);

    container.append("div")
      .attr("class", "vzb-data-notes-body vzb-dialog-scrollable")

    container.append("div")
      .attr("class", "vzb-data-notes-link")

  },

  resize: function() {
    this.close();
  },

  close: function() {
    if(!hidden) {
      this.pin(false).hide();
    }
  },

  setHook: function(_hookName) {
    if(!this._readyOnce) return this;
    if(pin) {
      newHookName = _hookName;
      return this;
    }
    if(hookName) this.model.marker[hookName].off('change:which', this.close);
    hookName = newHookName = _hookName;
    this.model.marker[hookName].on('change:which', this.close);

    this.setValues();

    return this;
  },

  setValues: function() {
    if(!hookName) return;
    var hook = this.model.marker[hookName];
    var concept = hook.getConceptprops();

    this.element.select('.vzb-data-notes-body')
      .classed('vzb-hidden', !concept.description)
      .text(concept.description||"");

    this.element.select('.vzb-data-notes-link').classed('vzb-hidden', !concept.sourceLink);

    if(concept.sourceLink) {
      var _source = this.translator('hints/source');
      var sourceName = concept.sourceName||"";
      this.element.select('.vzb-data-notes-link').html('<span>' + (sourceName ? (_source + ':') : '') +
        '<a href="' + concept.sourceLink + '" target="_blank">' + (sourceName ? sourceName : _source) + '</a></span>');
    }
    showNotes = concept.sourceLink || concept.description;
  },

  setPos: function(_left, _top, force) {
    left = _left;
    top = _top;
    if(pin && !force) return this;
    var parentHeight = this.parent.element.offsetHeight;
    var width = this.element.node().offsetWidth;
    var height = this.element.node().offsetHeight;
    var leftMove;
    var topMove;
    var leftPos = left - width;
    var topPos = top;
    if(leftPos < 10) {
      leftPos = 10;
      leftMove = true;
    }
    if((topPos + height + 10) > parentHeight) {
      topPos = parentHeight - height - 10;
      topMove = true;
    }

    if(leftMove && topMove) {
      topPos = top - height - 30;
    }

    this.element.style({'top': topPos + 'px', 'left': leftPos + 'px'});

    return this;
  },

  pin: function(arg) {
    if(hidden) return this;
    pin = !pin;
    if(arg != null) pin = arg;
    this.element.select('.vzb-data-notes-close').classed('vzb-hidden', !pin);
    this.element.classed('vzb-data-notes-pinned', pin);
    if(hookName != newHookName) this.setHook(newHookName);
    this.element.select('.vzb-data-notes-body').node().scrollTop = 0;
    if(!showNotes) {
      return this.hide();
    } else {
      return this.setPos(left, top, true);
    }
  },

  toggle: function(arg) {
    if(pin || !hookName) return this;
    if(arg == null) arg = !hidden;
    hidden = arg;
    this.element.classed("vzb-hidden", hidden || !showNotes);
    return this;
  },

  show: function() {
    return this.toggle(false);
  },

  hide: function() {
    return this.toggle(true);
  }

});

export default DataNotes;
