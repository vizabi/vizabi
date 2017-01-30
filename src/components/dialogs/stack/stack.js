import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import draggablelist from 'components/draggablelist/draggablelist';


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

        // in dialog, this.model_expects = ["state", "ui", "locale"];

        this.components = [{
            component: draggablelist,
            placeholder: '.vzb-dialog-draggablelist',
            model: ["state.marker.group", "state.marker.color", "locale", "ui.chart"],
            groupID: "manualSorting",
            isEnabled: "manualSortingEnabled",
            dataArrFn: _this.manualSorting.bind(_this),
            lang: ''
        }];

        this.model_binds = {
          'change:state.marker.group': function(evt) {
            //console.log("group change " + evt);
            if(!_this._ready) return;
            _this.updateView();
          }
        };

        this._super(config, parent);
    },


    readyOnce: function() {
      this._super();

      var _this = this;
      this.group = this.model.state.marker.group;
      this.stack = this.model.state.marker.stack;

      this.howToStackEl = this.element.select('.vzb-howtostack').selectAll("input")
          .on("change", function() {
              _this.setModel("stack", d3.select(this).node().value);
          })
      this.howToMergeEl = this.element.select('.vzb-howtomerge').selectAll("input")
          .on("change", function() {
              _this.setModel("merge", d3.select(this).node().value);
          })

      this.updateView();
    },
    
    ready: function() {
      this._super();
      if(!this.model.state.marker.color.isDiscrete()) {
        if(this.stack.use == "property") { 
          this.setModel("stack", "none");
          return;
        } 
        else if(this.group.merge) {
          this.setModel("merge", "none");
          return;
        }
      }
      this.updateView();
    },

    updateView: function() {
        var _this = this;

        this.howToStackEl
            .property('checked', function() {
                if(d3.select(this).node().value === "none") return _this.stack.which==="none";
                if(d3.select(this).node().value === "bycolor") return _this.stack.which===_this.model.state.marker.color.which;
                if(d3.select(this).node().value === "all") return _this.stack.which==="all";
            })
            .attr('disabled', function(){
                if(d3.select(this).node().value === "none") return null; // always enabled
                if(d3.select(this).node().value === "all") return null; // always enabled
                if(d3.select(this).node().value === "bycolor") return _this.model.state.marker.color.use !== "property" ? true : null;
            });
        
        _this.model.ui.chart.manualSortingEnabled = _this.stack.which == "all";
        
        this.howToMergeEl
            .property('checked', function() {
                if(d3.select(this).node().value === "none") return !_this.group.merge && !_this.stack.merge;
                if(d3.select(this).node().value === "grouped") return _this.group.merge;
                if(d3.select(this).node().value === "stacked") return _this.stack.merge;
            })
            .attr('disabled', function(){
                if(d3.select(this).node().value === "none") return null; // always enabled
                if(d3.select(this).node().value === "grouped") return _this.stack.which === "none" || _this.model.state.marker.color.use !== "property" ? true : null;
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
          
          switch (value){
            case "all":
              obj.stack.use = "constant";
              obj.stack.which = "all";
              break;
            case "none":
              obj.stack.use = "constant";
              obj.stack.which = "none";
              break;
            case "bycolor":
              obj.stack.use = "property";
              obj.stack.which = this.model.state.marker.color.which;
              break;
          }

            //validate possible merge values in group and stack hooks
            if(value === "none" && this.group.merge) obj.group.merge = false;
            if(value !== "all" && this.stack.merge) obj.stack.merge = false;
        }

        this.model.state.marker.set(obj);
    }
});

export default Stack;
