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
            model: ["language"],
            dataArrFn: _this.manualSorting.bind(_this),
            lang: 'region/'
        }];

        this.model_binds = {
            'change:state:marker:stack': function() {
                console.log("stack change event");
                _this.updateView();
            },
            'change:state:marker:group': function() {
                console.log("group change event");
                _this.updateView();
            }
        };
            
        this._super(config, parent);
    },

    readyOnce: function() {
        var _this = this;
        this.element = d3.select(this.element);

        this.howToStackEl = this.element.select('#vzb-howtostack').selectAll("input")
            .on("change", function() {
                _this.setModel("stack", d3.select(this).node().value);
            })
        this.howToMergeEl = this.element.select('#vzb-howtomerge').selectAll("input")
            .on("change", function() {
                _this.setModel("merge", d3.select(this).node().value);
            })
        
        this.updateView();
        this._super();
    },
    
    updateView: function() {
        var _this = this;

        this.howToStackEl
            .property('checked', function() {
                return d3.select(this).node().value === _this.model.state.marker.stack.which;
            });
        
        this.howToMergeEl
            .property('checked', function() {
                if(d3.select(this).node().value === "none")  return !_this.model.state.marker.group.merge && !_this.model.state.marker.stack.merge;
                if(d3.select(this).node().value === "grouped") return _this.model.state.marker.group.merge;
                if(d3.select(this).node().value === "stacked") return _this.model.state.marker.stack.merge;
            })
            .attr('disabled', function(){
                if(d3.select(this).node().value === "none")  return null; // always enabled
                if(d3.select(this).node().value === "grouped") return _this.model.state.marker.stack.which === "none" ? true : null;
                if(d3.select(this).node().value === "stacked") return _this.model.state.marker.stack.which === "all" ? null : true;
            });
        
        
    },

    manualSorting: function(value) {
        if(arguments.length === 0) return this.model.state.marker.group.manualSorting;
        this.model.state.marker.group.manualSorting = value;
    },

    setModel: function(what, value) {

        if(what == "merge") {
            switch (value){
                case "none": 
                    this.model.state.marker.group.merge = false;
                    this.model.state.marker.stack.merge = false;
                    break;
                case "grouped": 
                    this.model.state.marker.group.merge = true;
                    this.model.state.marker.stack.merge = false;
                    break;
                case "stacked": 
                    this.model.state.marker.group.merge = false;
                    this.model.state.marker.stack.merge = true;
                    break;
            }
            

        } else {

            var mdl = this.model.state.marker.stack;

            var obj = {};
            obj.which = value;
            if(utils.values(mdl.getPalettes()).indexOf(value) == -1) {
                obj.use = "property";
            } else {
                obj.use = "value";
            }

            mdl.set(obj, true);
        }
    }
});

export default Stack;