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
                model: ["time"],
                ui: {
                    show_button: false,
                    show_value: true
                }
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-dialog-timeslider-2',
                model: ["time"],
                ui: {
                    show_button: true
                }
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-dialog-timeslider-3',
                model: ["time"],
                ui: {
                    show_button: false,
                    show_limits: true
                }
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-dialog-timeslider-4',
                model: ["time"],
                ui: {
                    show_button: true,
                    show_value: true
                }
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-dialog-timeslider-5',
                model: ["time"],
                ui: {
                    show_button: false,
                    show_limits: true
                }
            }];

            this._super(config, parent);
        }
    });

    return MoreOptionsDialog;
});