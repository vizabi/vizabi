define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var ColorsDialog = Dialog.extend({
        init: function(config, parent) {
            this.name = 'colors';
            this._super(config, parent);
        }
    });

    return ColorsDialog;
});