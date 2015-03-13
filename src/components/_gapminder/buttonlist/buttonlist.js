//TODO: refactor this whole thing!

define([
    'd3',
    'lodash',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    //default existing buttons
    var class_active = "vzb-active",
        class_vzb_fullscreen = "vzb-force-fullscreen";

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

            this.model_expects = [{
                name: "state",
                type: "model"
            }, {
                name: "ui",
                type: "model"
            }];

            this.components = [];
            //basic template data for buttons
            this.template_data = {
                buttons: []
            };

            this._available_buttons = {
                'find': {
                    title: "buttons/find",
                    icon: "search",
                    dialog: true
                },
                'more-options': {
                    title: "buttons/more_options",
                    icon: "gear",
                    dialog: true
                },
                'colors': {
                    title: "buttons/colors",
                    icon: "paint-brush",
                    dialog: true
                },
                'size': {
                    title: "buttons/size",
                    icon: "circle",
                    dialog: true
                },
                'fullscreen': {
                    title: "buttons/expand",
                    icon: "expand",
                    dialog: false,
                    func: this.toggleFullScreen.bind(this)
                },
                '_default': {
                    title: "Button",
                    icon: "asterisk",
                    dialog: false
                }
            };

            if (config.buttons && config.buttons.length > 0) {
                //TODO: Buttons should be a model, not config //former FIXME
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

                var btn = button_list[i],
                    btn_config = this._available_buttons[btn];

                //if it's a dialog, add component
                if (btn_config && btn_config.dialog) {
                    //add corresponding component
                    this.components.push({
                        component: '_gapminder/buttonlist/dialogs/' + btn,
                        placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]',
                        model: ["state", "ui"]
                    });
                }

                //add template data
                var d = (btn_config) ? btn : "_default",
                    details_btn = this._available_buttons[d];

                details_btn.id = btn;
                this.template_data.buttons.push(details_btn);

            };

        },

        /*
         * POSTRENDER:
         * Executed once after loading
         */
        domReady: function() {
            var _this = this,
                buttons = this.element.selectAll(".vzb-buttonlist-btn");

            //activate each dialog when clicking the button
            buttons.on('click', function() {
                var btn = d3.select(this),
                    id = btn.attr("data-btn"),
                    classes = btn.attr("class"),
                    btn_config = _this._available_buttons[id];

                //if it's a dialog, open
                if (btn_config && btn_config.dialog) {
                    //close if it's open
                    if (classes.indexOf(class_active) !== -1) {
                        _this.closeDialog(id);
                    } else {
                        _this.openDialog(id);
                    }
                }
                //otherwise, execute function
                else if (btn_config.func && _.isFunction(btn_config.func)) {
                    btn_config.func(id);
                }

            });

            close_buttons = this.element.selectAll("[data-click='closeDialog']");
            close_buttons.on('click', function() {
                _this.closeAllDialogs();
            });

            //store body overflow
            this._prev_body_overflow = document.body.style.overflow;
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
        openDialog: function(id) {

            this.closeAllDialogs();
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

            //remove classes
            btn.classed(class_active, true);
            dialog.classed(class_active, true);
        },

        /*
         * Closes a button dialog
         * @param {String} id button id
         */
        closeDialog: function(id) {

            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

            //remove classes
            btn.classed(class_active, false);
            dialog.classed(class_active, false);
        },

        /*
         * Close all dialogs
         */
        closeAllDialogs: function() {
            //remove classes
            var all_btns = this.element.selectAll(".vzb-buttonlist-btn"),
                all_dialogs = this.element.selectAll(".vzb-buttonlist-dialog");
            all_btns.classed(class_active, false);
            all_dialogs.classed(class_active, false);
        },

        toggleFullScreen: function(id) {

            var component = this,
                root = component.placeholder,
                root_found = false,
                btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                fs = !this.model.ui.fullscreen,
                body_overflow = (fs) ? "hidden" : this._prev_body_overflow;

            while (!(root_found = root.classed('vzb-placeholder'))) {
                component = this.parent;
                root = component.placeholder;
            };

            //TODO: figure out a way to avoid fullscreen resize delay in firefox
            if (fs) {
                launchIntoFullscreen(root.node());
            } else {
                exitFullscreen();
            }

            root.classed(class_vzb_fullscreen, fs);
            this.model.ui.fullscreen = fs;
            btn.classed(class_active, fs);

            //restore body overflow
            document.body.style.overflow = body_overflow;

            //force window resize event
            (function() {
                event = document.createEvent("HTMLEvents");
                event.initEvent("resize", true, true);
                event.eventName = "resize";
                window.dispatchEvent(event);
            })();

        }

    });

    function launchIntoFullscreen(elem) {
        console.log('test');
        console.log(elem);
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }


    return ButtonList;
});