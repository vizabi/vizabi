define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var MoreOptionsDialog = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'more-options';

            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-dialog-timeslider',
                model: ["time"]
            }];

            this._super(config, parent);
        }
    });

    return MoreOptionsDialog;
});