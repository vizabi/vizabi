define([
    'd3',
    'base/layout',
    'base/component'
], function(d3, Layout, Component) {

    var Dialog = Component.extend({
        init: function(config, parent) {
            this.name = this.name || '';
            
            this.template = 'components/_gapminder/buttonlist/'+
                            'dialogs/'+this.name+'/'+this.name;

            this.layout = new Layout();

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