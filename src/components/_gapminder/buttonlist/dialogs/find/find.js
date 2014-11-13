define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var FindDialog = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'find';

            this._super(config, parent);
        }
    });

    return FindDialog;
});