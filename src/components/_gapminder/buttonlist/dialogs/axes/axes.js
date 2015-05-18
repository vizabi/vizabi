define([
    'd3',
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(d3, Dialog) {

    
    var AxesDialog = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'axes';
            var _this = this;

            this.components = [{
                component: '_gapminder/indicator-picker',
                placeholder: '.vzb-xaxis-container',
                model: ["state.marker.axis_x", "language"]
            },{
                component: '_gapminder/indicator-picker',
                placeholder: '.vzb-yaxis-container',
                model: ["state.marker.axis_y", "language"]
            },{
                component: '_gapminder/simple-checkbox',
                placeholder: '.vzb-axes-options',
                model: ["state", "language"],
                submodel: 'time',
                checkbox: 'adaptMinMaxZoom'
            }];

            this._super(config, parent);
        }
    });

    return AxesDialog;
});


