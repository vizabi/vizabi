define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var SizeDialog = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'size';

            this.components = [{
                component: '_gapminder/bubble-size',
                placeholder: '.vzb-dialog-bubble-size',
                model: ["show"],
                ui: {
                    show_button: false
                }
            }];

            this._super(config, parent);
        }
    });

    return SizeDialog;
});