//IndicatorPicker
define([
    'd3',
    'base/component'
], function(d3, Component) {
    
    var SimpleCheckbox = Component.extend({

        init: function(config, context) {
            this.template = "components/_gapminder/simple-checkbox/simple-checkbox";
            var _this = this;
            
            this.checkbox = config.checkbox;

            this.model_expects = [{
                name: "mdl"
                //TODO: learn how to expect model "axis" or "size" or "color"
            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "readyOnce": function(evt) {
                    _this.updateView();
                },
                "change:language": function(evt) {
                    _this.updateView();
                },
                "ready": function(evt) {
                }
            }
            
            this.model_binds["change:mdl:"+this.checkbox] = function() {
                _this.updateView();
            };

            //contructor is the same as any component
            this._super(config, context);
        },

        domReady: function() {
            var _this = this;
            var id = "-check-" + Math.random()*1000;
            this.labelEl = this.element.select('label').attr("for", id);
            this.checkEl = this.element.select('input').attr("id", id)
                .on("change", function(){
                    _this._setModel(d3.select(this).property("checked"));
                });
        },

        updateView: function() {
            this.translator = this.model.language.getTFunction();
            this.labelEl.text(this.translator("check/" + this.checkbox));
            this.checkEl.property("checked", !!this.model.mdl[this.checkbox]);
        },
        

        _setModel: function (value) {
            this.model.mdl[this.checkbox] = value;
        },
        
    });

    return SimpleCheckbox;

});