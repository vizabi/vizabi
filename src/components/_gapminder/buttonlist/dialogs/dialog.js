define([
    'd3',
    'base/component'
], function(d3, Component) {

    var Dialog = Component.extend({
        init: function(config, parent) {
            this.name = this.name || '';
            
            this.template = 'components/_gapminder/buttonlist/'+
                            'dialogs/'+this.name+'/'+this.name;

            this._super(config, parent);
        },

        postRender: function() {
            close_buttons = this.element.selectAll("[data-click='closeDialog']");

            var _this = this;
            close_buttons.on('click', function() {
                _this.parent.closeAllDialogs();
            });
        }

    });

    return Dialog;
});