define([
    'd3',
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(d3, Dialog) {

    
    var MoreOptionsDialog  = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'more-options';
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
            },{
                component: '_gapminder/bubble-size',
                placeholder: '.vzb-dialog-bubble-size',
                model: ["state.marker.size"]
            },{
                component: '_gapminder/indicator-picker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"]
            },{
                component: '_gapminder/indicator-picker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
                component: '_gapminder/color-legend',
                placeholder: '.vzb-clegend-container',
                model: ["state.marker.color", "language"]
            },{
                component: '_gapminder/bubble-opacity',
                placeholder: '.vzb-dialog-bubble-opacity',
                model: ["state.entities"]
            }];
            
            this._super(config, parent);
        },
        
        domReady: function() {
            this.opacity_nonselected = this.element.select(".vzb-dialog-bubble-opacity");
        },
    });

    return MoreOptionsDialog;
});
