import * as utils from 'base/utils';
import Component from 'base/component';

import {close as iconClose} from 'base/iconset';

var hidden = true;
var showNotes = false;
var pin = false;
var left = 0;
var top = 0;
var which = null;
//var description = null;
//var sourceName = null;
var sourceLink = null;

var DataNotes = Component.extend({

  init: function(config, context) {
    var _this = this;

    this.name = 'gapminder-datanotes';

    this.model_expects = [{
      name: "language",
      type: "language"
    }];

    this.context = context;

    this.model_binds = {
      "change:language.strings": function(evt) {
        _this.ready();
      }
    }

    //contructor is the same as any component
    this._super(config, context);

    this.ui = utils.extend({
      //...add properties here
    }, this.ui);

  },

  ready: function() {
    this.translator = this.model.language.getTFunction();  
    //this.setValues();  
  },

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.placeholder);

    this.element.selectAll("div").remove();

    var container = this.element;

    container.append("div")
      .html(iconClose)
      .on("click", function() {
        d3.event.stopPropagation();
        _this.pin(false);
        _this.element.select('.vzb-data-notes-body').node().scrollTop = 0;
        _this.toggle();
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
    if(!hidden) {
      this.pin(false).toggle();
    }  
  },
  
  setHook: function(hook) {
    if(pin) return this;
    which = hook.which;
    //description = hook.getMetadata().description;
    //sourceName = hook.getMetadata().sourceName;
    sourceLink = hook.getMetadata().sourcelink;
    this.element.select('.vzb-data-notes-link').classed('vzb-hidden', !sourceLink);

    this.setValues();    
     
    return this;
  },
  
  setValues: function() {
    var description = this.translator('description/' + which);
    var showDescription = description != ('description/' + which);  
    if(showDescription) this.element.select('.vzb-data-notes-body').text(description);
    this.element.select('.vzb-data-notes-body').classed('vzb-hidden', !showDescription);
    
    if(sourceLink) {
      var _source = this.translator('hints/source');
      var sourceName = this.translator('sourceName/' + which);
      var showSourceName = sourceName != ('sourceName/' + which);
      this.element.select('.vzb-data-notes-link').html('<span>' + (showSourceName ? (_source + ':') : '') + 
        '<a href="' + sourceLink + '" target="_blank">' + (showSourceName ? sourceName : _source) + '</a></span>');
    }
    showNotes = sourceLink || showDescription;
  },
  
  setPos: function(_left, _top, force) {
    if(pin && !force) return this;
    left = _left;
    top = _top;
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
    pin = true;
    if(arg != null) pin = arg;    
    this.element.select('.vzb-data-notes-close').classed('vzb-hidden', !pin);
    this.element.classed('vzb-data-notes-pinned', pin);
    if(pin) this.setPos(left, top, true);
    return this;
  },

  toggle: function(arg) {
    if(pin || !showNotes) return this;
    if(arg == null) arg = !hidden;
    hidden = arg;
    this.element.classed("vzb-hidden", hidden);
    return this;
  }

});

export default DataNotes;