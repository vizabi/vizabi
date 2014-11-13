define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var SizeDialog = Dialog.extend({
        init: function(config, parent) {
            this.name = 'size';
            this._super(config, parent);
        }
    });

    return SizeDialog;
});