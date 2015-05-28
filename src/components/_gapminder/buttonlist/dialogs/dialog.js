/*!
 * VIZABI DIALOG
 * Reusable Dialog component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    Vizabi.Component.extend('gapminder-buttonlist-dialog', {
        /**
         * Initializes the dialog
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} parent Reference to tool
         */
        init: function(config, parent) {
            this.name = this.name || '';

            this.model_expects = this.model_expects || [{
                name: "state",
                type: "model"
            }, {
                name: "ui",
                type: "model"
            }, {
                name: "language",
                type: "language"
            }];
            
            this.template = 'src/components/_gapminder/buttonlist/'+
                            'dialogs/'+this.name+'/'+this.name+'.html';

            this._super(config, parent);
        },

        /**
         * Executed when the dialog has been rendered
         */
        readyOnce: function() {
            this.element = d3.select(this.element);
            close_buttons = this.element.selectAll("[data-click='closeDialog']");
            var _this = this;
            close_buttons.on('click', function() {
                _this.parent.closeAllDialogs();
            });
        },

        /**
         * User has clicked to open this dialog
         */
        open: function() {
            //placeholder function
        },

        /**
         * User has closed this dialog
         */
        close: function() {
            //placeholder function
        }

    });

}).call(this);