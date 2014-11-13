//TODO: refactor this whole thing!

define([
    'd3',
    'lodash',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    //default existing buttons
    var class_active = "vzb-active",
        available_buttons = {
            'more-options': {
                title: "buttons/more_options",
                icon: "gear"
            },
            '_default': {
                title: "Button",
                icon: "asterisk"
            }
        };

    var ButtonList = Component.extend({

        /**
         * Initializes the buttonlist
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, context) {
            //set properties
            this.name = 'buttonlist';
            this.template = "components/_gapminder/" + this.name + "/" + this.name;

            this.components = [];
            //basic template data for buttons
            this.template_data = {
                buttons: []
            };

            if(config.buttons && config.buttons.length > 0) {
                this._addButtons(config.buttons);
            }

            this._super(config, context);

        },

        /*
         * adds buttons configuration to the components and template_data
         * @param {Array} button_list list of buttons to be added
         */
        _addButtons: function(button_list) {

            //add a component for each button
            for (var i = 0; i < button_list.length; i++) {

                var btn = button_list[i];

                //add corresponding component
                this.components.push({
                    component: '_gapminder/buttonlist/dialogs/' + btn,
                    placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]'
                });

                //add template data
                var d = (available_buttons[btn]) ? btn : "_default",
                    details_btn = available_buttons[d];

                details_btn.id = btn;
                this.template_data.buttons.push(details_btn);

            };

        },

        /*
         * POSTRENDER:
         * Executed once after loading
         */
        postRender: function() {
            var _this = this,
                buttons = d3.selectAll(".vzb-buttonlist-btn");

            //activate each dialog when clicking the button
            buttons.on('click', function() {
                var btn = d3.select(this),
                    id = btn.attr("data-btn"),
                    classes = btn.attr("class");

                //close if it's open
                if (classes.indexOf(class_active) !== -1) {
                    _this._closeDialog(id);
                } else {
                    _this._openDialog(id);
                }
            });
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            //TODO: what to do when resizing?
        },

        //TODO: make opening/closing a dialog via update and model
        /*
         * Activate a button dialog
         * @param {String} id button id
         */
        _openDialog: function(id) {

            this._closeAllDialogs();
            var btn = d3.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                dialog = d3.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

            //remove classes
            btn.classed(class_active, true);
            dialog.classed(class_active, true);
        },

        /*
         * Closes a button dialog
         * @param {String} id button id
         */
        _closeDialog: function(id) {

            var btn = d3.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                dialog = d3.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

            //remove classes
            btn.classed(class_active, false);
            dialog.classed(class_active, false);
        },

        /*
         * Close all dialogs
         */
        _closeAllDialogs: function() {
            //remove classes
            var all_btns = d3.selectAll(".vzb-buttonlist-btn"),
                all_dialogs = d3.selectAll(".vzb-buttonlist-dialog");
            all_btns.classed(class_active, false);
            all_dialogs.classed(class_active, false);
        }

    });


    return ButtonList;
});