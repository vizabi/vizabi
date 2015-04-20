//TODO: refactor this whole thing!

define([
    'd3',
    'lodash',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    //default existing buttons
    var class_active = "vzb-active";
    var class_unavailable = "vzb-unavailable";
    var class_vzb_fullscreen = "vzb-force-fullscreen";

    var ButtonList = Component.extend({

        /**
         * Initializes the buttonlist
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, context) {
            //set properties
            var _this = this;
            this.name = 'buttonlist';
            this.template = "components/_gapminder/" + this.name + "/" + this.name;

            this.model_expects = [{
                name: "state",
                type: "model"
            }, {
                name: "ui",
                type: "model"
            }, {
                name: "language",
                type: "language"
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
                'trails': {
                    title: "buttons/trails",
                    icon: "trails",
                    dialog: false,
                    func: this.toggleBubbleTrails.bind(this)
                },
                'lock': {
                    title: "buttons/lock",
                    icon: "lock",
                    dialog: false,
                    func: this.toggleBubbleLock.bind(this)
                },
                '_default': {
                    title: "Button",
                    icon: "asterisk",
                    dialog: false
                }
            };

            this._active_comp = false;

            if (config.buttons && config.buttons.length > 0) {
                //TODO: Buttons should be a model, not config //former FIXME
                this._addButtons(config.buttons);
            }
            
            this.model_binds = {
                "readyOnce": function(evt) {
                    _this.startup(config.buttons);
                },
                "change:state:entities:select": function() {
                    if(_this.model.state.entities.select.length == 0){
                        _this.model.state.time.lockNonSelected = 0;
                    }
                    _this.startup(config.buttons);
                }
            }

            this._super(config, context);

        },
        
        startup: function(button_list){
            var _this = this;
            
            button_list.forEach(function(d){
                switch (d){
                    case "trails": _this.setBubbleTrails(d); break;
                    case "lock": _this.setBubbleLock(d); break;
                }
            })
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
                    var comps = this.components;

                    //add corresponding component
                    comps.push({
                        component: '_gapminder/buttonlist/dialogs/' + btn,
                        placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]',
                        model: ["state", "ui"]
                    });

                    btn_config.component = comps.length - 1;
                }

                //add template data
                var d = (btn_config) ? btn : "_default",
                    details_btn = this._available_buttons[d];

                details_btn.id = btn;
                //grab icon svg
                details_btn.icon = this._icons[details_btn.icon];

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

            //add classes
            btn.classed(class_active, true);
            dialog.classed(class_active, true);

            this._active_comp = this.components[this._available_buttons[id].component];
            //call component function
            this._active_comp.open();
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

            //call component close function
            if(this._active_comp) {
                this._active_comp.close();
            }
            this._active_comp = false;
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

            //call component close function
            if(this._active_comp) {
                this._active_comp.close();
            }
            this._active_comp = false;
        },

        toggleBubbleTrails: function(id) {
            this.model.state.time.trails = !this.model.state.time.trails;
            this.setBubbleTrails(id);
        },
        setBubbleTrails: function(id, trails) {
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            
            btn.classed(class_active, this.model.state.time.trails);
        },
        toggleBubbleLock: function(id) {
            if(this.model.state.entities.select.length == 0) return;
            
            var timeFormatter = d3.time.format(this.model.state.time.formatInput);
            var locked = this.model.state.time.lockNonSelected;
            locked = locked?0:timeFormatter(this.model.state.time.value);
            this.model.state.time.lockNonSelected = locked;
            
            this.setBubbleLock(id);
        },
        setBubbleLock: function(id) {
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            var translator = this.model.language.getTFunction();
            
            var locked = this.model.state.time.lockNonSelected;
            
            btn.classed(class_unavailable, this.model.state.entities.select.length == 0);
            
            btn.classed(class_active, locked)
            btn.select(".vzb-buttonlist-btn-title")
                .text(locked?locked:translator("buttons/lock"));
            
            btn.select(".vzb-buttonlist-btn-icon")
                .html(this._icons[locked?"lock":"unlock"]);
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
            var translator = this.model.language.getTFunction();
            btn.classed(class_active, fs);
            btn.select(".vzb-buttonlist-btn-icon").html(this._icons[fs?"unexpand":"expand"]);
            btn.select(".vzb-buttonlist-btn-title").text(
                translator("buttons/" + (fs?"unexpand":"expand"))
            );

            //restore body overflow
            document.body.style.overflow = body_overflow;

            //force window resize event
            (function() {
                event = document.createEvent("HTMLEvents");
                event.initEvent("resize", true, true);
                event.eventName = "resize";
                window.dispatchEvent(event);
            })();

        },

        //TODO: figure out a better way to tempate the icons
        // SVG VIZABI ICONS
        // source: https://github.com/encharm/Font-Awesome-SVG-PNG/
        _icons: {
            'paint-brush': '<svg class="vzb-icon vzb-icon-paint-brush" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1615 0q70 0 122.5 46.5t52.5 116.5q0 63-45 151-332 629-465 752-97 91-218 91-126 0-216.5-92.5t-90.5-219.5q0-128 92-212l638-579q59-54 130-54zm-909 1034q39 76 106.5 130t150.5 76l1 71q4 213-129.5 347t-348.5 134q-123 0-218-46.5t-152.5-127.5-86.5-183-29-220q7 5 41 30t62 44.5 59 36.5 46 17q41 0 55-37 25-66 57.5-112.5t69.5-76 88-47.5 103-25.5 125-10.5z"/></svg>',
            'search': '<svg class="vzb-icon vzb-icon-search" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1216 832q0-185-131.5-316.5t-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5 316.5-131.5 131.5-316.5zm512 832q0 52-38 90t-90 38q-54 0-90-38l-343-342q-179 124-399 124-143 0-273.5-55.5t-225-150-150-225-55.5-273.5 55.5-273.5 150-225 225-150 273.5-55.5 273.5 55.5 225 150 150 225 55.5 273.5q0 220-124 399l343 343q37 37 37 90z"/></svg>',
            'circle': '<svg class="vzb-icon vzb-icon-circle" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1664 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>',
            'expand': '<svg class="vzb-icon vzb-icon-expand" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M883 1056q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23zm781-864v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45z"/></svg>',
            'asterisk': '<svg class="vzb-icon vzb-icon-asterisk" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1546 1050q46 26 59.5 77.5t-12.5 97.5l-64 110q-26 46-77.5 59.5t-97.5-12.5l-266-153v307q0 52-38 90t-90 38h-128q-52 0-90-38t-38-90v-307l-266 153q-46 26-97.5 12.5t-77.5-59.5l-64-110q-26-46-12.5-97.5t59.5-77.5l266-154-266-154q-46-26-59.5-77.5t12.5-97.5l64-110q26-46 77.5-59.5t97.5 12.5l266 153v-307q0-52 38-90t90-38h128q52 0 90 38t38 90v307l266-153q46-26 97.5-12.5t77.5 59.5l64 110q26 46 12.5 97.5t-59.5 77.5l-266 154z"/></svg>',
            'trails': '<svg class="vzb-icon vzb-icon-trails" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1344 1024q133 0 226.5 93.5t93.5 226.5-93.5 226.5-226.5 93.5-226.5-93.5-93.5-226.5q0-12 2-34l-360-180q-92 86-218 86-133 0-226.5-93.5t-93.5-226.5 93.5-226.5 226.5-93.5q126 0 218 86l360-180q-2-22-2-34 0-133 93.5-226.5t226.5-93.5 226.5 93.5 93.5 226.5-93.5 226.5-226.5 93.5q-126 0-218-86l-360 180q2 22 2 34t-2 34l360 180q92-86 218-86z"/></svg>',
            'lock': '<svg class="vzb-icon vzb-icon-lock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M640 768h512v-192q0-106-75-181t-181-75-181 75-75 181v192zm832 96v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-192q0-184 132-316t316-132 316 132 132 316v192h32q40 0 68 28t28 68z"/></svg>',
            'unlock': '<svg class="vzb-icon vzb-icon-unlock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1376 768q40 0 68 28t28 68v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-320q0-185 131.5-316.5t316.5-131.5 316.5 131.5 131.5 316.5q0 26-19 45t-45 19h-64q-26 0-45-19t-19-45q0-106-75-181t-181-75-181 75-75 181v320h736z"/></svg>',
            'unexpand': '<svg class="vzb-icon vzb-icon-unexpand" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 960v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45zm755-672q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23z"/></svg>'
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