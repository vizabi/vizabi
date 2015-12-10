import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import {
    draggablelist
}
from 'components/_index'


/*
 * stack dialog
 */

var Stack = Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function(config, parent) {
        this.name = 'stack';
        var _this = this;

        // in dialog, this.model_expects = ["state", "data"];

        this.components = [{
            component: draggablelist,
            placeholder: '.vzb-dialog-draggablelist',
            model: ["state.marker.group", "language"],
            groupID: "manualSorting",
            dataArrFn: _this.manualSorting.bind(_this),
            lang: 'region/'
        }];

        this.model_binds = {
            'change:state:marker:stack': function(evt) {
                //console.log("stack change " + evt);
                _this.updateView();
            },
            'change:state:marker:group': function(evt) {
                //console.log("group change " + evt);
                _this.updateView();
            }
        };

        this._super(config, parent);
    },

    resize: function() {
      if (this.getLayoutProfile() == 'small') {
        var height = this.root.element.offsetHeight;
        var titleHeight = this.element.select(".vzb-dialog-title").node().offsetHeight;
        var buttonsHeight = this.element.select(".vzb-dialog-buttons").node().offsetHeight;
        this.element.select(".vzb-dialog-content.vzb-dialog-scrollable").style('max-height', height - 90 - titleHeight - buttonsHeight + 'px');
      } else {
        this.element.select(".vzb-dialog-content").style('max-height', '');
      }
      this._super();
    },

    readyOnce: function() {
      this._super();

      var _this = this;
      this.group = this.model.state.marker.group;
      this.stack = this.model.state.marker.stack;

      this.howToStackEl = this.element.select('#vzb-howtostack').selectAll("input")
          .on("change", function() {
              _this.setModel("stack", d3.select(this).node().value);
          })
      this.howToMergeEl = this.element.select('#vzb-howtomerge').selectAll("input")
          .on("change", function() {
              _this.setModel("merge", d3.select(this).node().value);
          })

      this.updateView();
    },

    updateView: function() {
        var _this = this;

        this.howToStackEl
            .property('checked', function() {
                return d3.select(this).node().value === _this.stack.which;
            });

        this.howToMergeEl
            .property('checked', function() {
                if(d3.select(this).node().value === "none")  return !_this.group.merge && !_this.stack.merge;
                if(d3.select(this).node().value === "grouped") return _this.group.merge;
                if(d3.select(this).node().value === "stacked") return _this.stack.merge;
            })
            .attr('disabled', function(){
                if(d3.select(this).node().value === "none")  return null; // always enabled
                if(d3.select(this).node().value === "grouped") return _this.stack.which === "none" ? true : null;
                if(d3.select(this).node().value === "stacked") return _this.stack.which === "all" ? null : true;
            });


    },

    manualSorting: function(value) {
        if(arguments.length === 0) return this.model.state.marker.group.manualSorting;
        this.model.state.marker.group.manualSorting = value;
    },

    setModel: function(what, value) {

        var obj = {stack: {}, group: {}};

        if(what === "merge") {
            switch (value){
                case "none":
                    obj.group.merge = false;
                    obj.stack.merge = false;
                    break;
                case "grouped":
                    obj.group.merge = true;
                    obj.stack.merge = false;
                    break;
                case "stacked":
                    obj.group.merge = false;
                    obj.stack.merge = true;
                    break;
            }
        }
        if(what === "stack") {

            obj.stack.which = value;

            //validate use of stack hook
            if(value !== "all" && value !== "none"){
                obj.stack.use = "property";
            } else {
                obj.stack.use = "constant";
            }

            //validate possible merge values in group and stack hooks
            if(value === "none" && this.group.merge) obj.group.merge = false;
            if(value !== "all" && this.stack.merge) obj.stack.merge = false;
        }

        this.model.state.marker.set(obj);
    }
});

export default Stack;
