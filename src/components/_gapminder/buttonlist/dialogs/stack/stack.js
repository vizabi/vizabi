/*
 * stack dialog
 */

(function () {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    Vizabi.Component.register('gapminder-buttonlist-stack', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function (config, parent) {
            this.name = 'stack';
            var _this = this;

            // in dialog, this.model_expects = ["state", "data"];

            this.model_binds = {
                'change:state:marker:stack': function () {
                    //console.log("stack change event");
                    _this.updateView();
                },
                'change:state:marker:group': function () {
                    //console.log("group change event");
                    _this.updateView();
                }
            }
            this._super(config, parent);
        },
        
        readyOnce: function(){
            var _this = this;
            this.element = d3.select(this.element);
            
            this.howToStackEl = this.element.select('#vzb-howtostack').selectAll("input")
                .on("change", function(){
                    _this.setModel("stack", d3.select(this).node().value);
                })
            
            this.mergeGroupedEl = this.element.select('#vzb-merge-grouped').selectAll("input")
                .on("change", function(){
                    _this.setModel("merge grouped", d3.select(this).property("checked"));
                })
            this.mergeStackedEl = this.element.select('#vzb-merge-stacked').selectAll("input")
                .on("change", function(){
                    _this.setModel("merge stacked", d3.select(this).property("checked"));
                })
            
            this.updateView();
            
        },
        
        updateView: function(){
            var _this = this;
            
            this.howToStackEl.property('checked', function(){
                return d3.select(this).node().value === _this.model.state.marker.stack.which;
            })  
            
            this.mergeGroupedEl.property('checked', this.model.state.marker.group.merge);
            this.mergeStackedEl.property('checked', this.model.state.marker.stack.merge);
        },
        
        setModel: function(what, value) {
            
            if(what == "merge grouped"){
                this.model.state.marker.group.merge = value;
            }else if (what == "merge stacked"){
                this.model.state.marker.stack.merge = value;
                
            }else{
                
                var mdl = this.model.state.marker.stack;

                var obj = {};
                obj.which = value;
                if(utils.values(mdl.getPalettes()).indexOf(value) == -1){
                    obj.use = "property";
                }else{
                    obj.use = "value";
                }

                mdl.set(obj);
            }
        }
    }));

}).call(this);