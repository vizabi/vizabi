define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var AxesDialog = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'axes';

            this.components = [{
                component: '_gapminder/bubble-axes',
                placeholder: '.vzb-dialog-bubble-axes',
                model: ["state.marker", /*"state.time",*/ "language"],
                ui: {
                    show_button: false
                }
            }];

            this._super(config, parent);
        }
    });

    return AxesDialog;
});