/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function () {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var globals = Vizabi._globals;
    var utils = Vizabi.utils;
    var iconset = Vizabi.iconset;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    var show = false;

    Vizabi.Component.extend('gapminder-datawarning', {



        init: function (config, context) {
            var _this = this;

            this.model_expects = [{
                name: "language",
                type: "language"
	        }];

            this.context = context;

            this.model_binds = {
                "change:language": function (evt) {
                    _this.updateView();
                }
            }

            //contructor is the same as any component
            this._super(config, context);

            this.ui = utils.extend({
                //...add properties here
            }, this.ui);

        },

        ready: function () {
            
        },

        readyOnce: function () {
            var _this = this;
            this.element = d3.select(this.placeholder);
            
            
            var container = this.element.select("div")
                .attr("class", "vzb-data-warning-box");
            
            container.append("div")
                .attr("class", "vzb-data-warning-close")
                .html("X")
                .on("click", function(){_this.toggle()});
            
            container.append("div")
                .attr("class", "vzb-data-warning-title")
                .html(this.parent.datawarning_content.title);
            
            container.append("div")
                .attr("class", "vzb-data-warning-body")
                .html(this.parent.datawarning_content.body);
                

        },



        toggle: function () {
            show = !show;
            this.element.classed("vzb-hidden", !show);
        }




    });

}).call(this);