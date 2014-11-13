define([
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(Dialog) {

    var MoreOptionsDialog = Dialog.extend({
        init: function(config, parent) {
            this.name = 'more-options';
            this._super(config, parent);
        }
    });

    return MoreOptionsDialog;
});