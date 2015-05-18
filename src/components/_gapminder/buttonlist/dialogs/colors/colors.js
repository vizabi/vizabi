define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var ColorsDialog = Dialog.extend({
        
    	/**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'colors';
            
            this.components = [{
                component: '_gapminder/indicator-picker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
                component: '_gapminder/color-legend',
                placeholder: '.vzb-clegend-container',
                model: ["state.marker.color", "language"]
            }];
            
            
            this._super(config, parent);
        }
    });

    return ColorsDialog;
});