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
                model: ["state.marker.size"],
                ui: {
                    show_button: false
                }
            },{
                component: '_gapminder/indicator-picker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"],
                ui: {selectIndicator: true, selectScaletype: false}
            }];

            this._super(config, parent);
        }
    });

    return SizeDialog;
});