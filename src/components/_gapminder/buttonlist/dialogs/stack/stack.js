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
                }
            }
            this._super(config, parent);
        },
        
        readyOnce: function(){
            var _this = this;
            this.element = d3.select(this.element);
            
            this.radio = this.element.selectAll('input')
                .on("change", function(){
                    _this.setModel(d3.select(this).node().value);
                })
            
            this.updateView();
            
        },
        
        updateView: function(){
            var _this = this;
            
            this.radio.property('checked', function(){
                return d3.select(this).node().value === _this.model.state.marker.stack.which;
            })  
        },
        
        setModel: function(value) {
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
    }));

}).call(this);