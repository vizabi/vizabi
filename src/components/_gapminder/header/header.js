define([
    'lodash',
    'base/utils',
    'base/component'
], function(_, utils, Component) {

    var Header = Component.extend({
        init: function(options, context) {
            //set properties
            this.name = 'header';
            this.template = "components/_gapminder/" + this.name + "/" + this.name;
            this._super(options, context);
        }

    });

    return Header;
});
