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

            this._super(config, parent);
        }
    });

    return SizeDialog;
});