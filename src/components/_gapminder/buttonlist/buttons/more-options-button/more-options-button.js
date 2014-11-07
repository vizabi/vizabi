define([
    'jquery',
    'base/utils',
    'base/component',
    'base/model'
], function($, utils, Component, Model) {

    var picker,
        countries,
        button_id = 'cog',
        button_title = 'cog',
        button_text = 'More Options';

    var PlayButton = Component.extend({
        init: function(parent, options) {
            this._super(parent, options);
            this.data = options.data;
            this.placeholder = options.placeholder;
        },

        postRender: function() {
            var parent = $(this.placeholder);

            var button = $('<button>').attr({
                title: button_title,
                class: 'vzb-buttonlist-btn vzb-buttonlist-btn-' + button_id
            });

            var icon = $('<span>').attr({
                class: 'vzb-btn-icon'
            });

            icon.appendTo(button)

            var i = $('<i>').attr({
                class: 'fa fa-' + button_id
            });

            i.appendTo(icon);


            var title = $('<span>').attr({
                class: 'vzb-btn-title',
            });

            title.html(button_text);
            title.appendTo(button);

            parent.append(button);
        },


        resize: function() {

        },


        update: function() {

        }

    });

    return PlayButton;
});