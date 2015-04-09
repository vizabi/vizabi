define([
    'd3',
    'base/layout',
    'base/component'
], function(d3, Layout, Component) {

    var Dialog = Component.extend({

        /**
         * Initializes the dialog
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} parent Reference to tool
         */
        init: function(config, parent) {
            this.name = this.name || '';

            this.model_expects = [{
                name: "state",
                type: "model"
            }, {
                name: "ui",
                type: "model"
            }];
            
            this.template = 'components/_gapminder/buttonlist/'+
                            'dialogs/'+this.name+'/'+this.name;

            this.layout = new Layout();

            this._super(config, parent);
        },

        /**
         * Executed when the dialog has been rendered
         */
        domReady: function() {
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

    return Dialog;
});