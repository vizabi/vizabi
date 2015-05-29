/*
 * More options dialog
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    
    Vizabi.Component.register('gapminder-buttonlist-more-options', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'more-options';

            this.components = [{
                component: 'gapminder-indicator-picker',
                placeholder: '.vzb-xaxis-container',
                model: ["state.marker.axis_x", "language"]
            },{
                component: 'gapminder-indicator-picker',
                placeholder: '.vzb-yaxis-container',
                model: ["state.marker.axis_y", "language"]
            },{
                component: 'gapminder-simple-checkbox',
                placeholder: '.vzb-axes-options',
                model: ["state", "language"],
                submodel: 'time',
                checkbox: 'adaptMinMaxZoom'
            },{
                component: 'gapminder-bubblesize',
                placeholder: '.vzb-dialog-bubble-size',
                model: ["state.marker.size"]
            },{
                component: 'gapminder-indicator-picker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"]
            },{
                component: 'gapminder-indicator-picker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
                component: 'gapminder-color-legend',
                placeholder: '.vzb-clegend-container',
                model: ["state.marker.color", "language"]
            },{
                component: 'gapminder-bubble-opacity',
                placeholder: '.vzb-dialog-bubble-opacity',
                model: ["state.entities"]
            }];
            
            this._super(config, parent);
        }
    }));

}).call(this);
