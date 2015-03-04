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

            // in dialog, this.model_expects = ["state", "data"];

            this.components = [{
                component: '_gapminder/bubble-size',
                placeholder: '.vzb-dialog-bubble-size',
                //TODO: this can't be specific because it's not always marker
                model: ["state.marker.size"],
                ui: {
                    show_button: false
                }
            }];

            this._super(config, parent);
        }
    });

    return SizeDialog;
});