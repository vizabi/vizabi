/* VIZABI - http://www.gapminder.org - 2015-06-01 */

(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/bubblesize/bubblesize.html');s.innerHTML = '<div class="vzb-bs-holder"> <input type="range" id="vzb-bs-slider" class="vzb-bs-slider" step="1"> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/axes/axes.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/axes") %> </div> <div class="vzb-dialog-content"> <p>X axis</p> <div class="vzb-xaxis-container"></div> <p>Y axis</p> <div class="vzb-yaxis-container"></div> <div class="vzb-axes-options"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/colors/colors.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/colors") %> </div> <div class="vzb-dialog-content"> <span class="vzb-caxis-container"></span> <div class="vzb-clegend-container"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/find/find.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/find") %> </div> <div class="vzb-dialog-content vzb-find-filter"> <input id="vzb-find-search" class="vzb-dialog-input" type="text" placeholder="Search..." /> </div> <div class="vzb-dialog-content vzb-dialog-content-fixed"> <div class="vzb-find-list">  </div> </div> <div class="vzb-dialog-buttons"> <div class="vzb-dialog-bubbleopacity vzb-dialog-control"></div> <div id="vzb-find-deselect" class="vzb-dialog-button"> <%=t ( "buttons/deselect") %> </div> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> <%=t ( "buttons/ok") %> </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/moreoptions/moreoptions.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/more_options") %> </div> <div class="vzb-dialog-content"> <p>Regular opacity</p> <div class="vzb-dialog-bubbleopacity-regular"></div> <p>Opacity of non-selected</p> <div class="vzb-dialog-bubbleopacity-selectdim"></div> <div class = "vzb-dialog-br"></div> <p>X axis</p> <div class="vzb-xaxis-container"></div> <p>Y axis</p> <div class="vzb-yaxis-container"></div> <div class="vzb-axes-options"></div> <div class = "vzb-dialog-br"></div> <p>Size</p> <div class="vzb-saxis-container"></div> <div class="vzb-dialog-bubblesize"></div> <div class = "vzb-dialog-br"></div> <p>Colors</p> <div class="vzb-caxis-container"></div> <div class="vzb-clegend-container"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/size/size.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/size") %> </div> <div class="vzb-dialog-content"> <p>Chose what to display as size</p> <div class="vzb-saxis-container"></div> <p>Choose maximum size of bubbles:</p> <div class="vzb-dialog-bubblesize"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/timeslider/timeslider.html');s.innerHTML = '<div class="vzb-timeslider"> <div class="vzb-ts-slider-wrapper"> <svg class="vzb-ts-slider"> <g> <g class="vzb-ts-slider-axis"></g> <g class="vzb-ts-slider-slide"> <circle class="vzb-ts-slider-handle"></circle> <text class="vzb-ts-slider-value"></text> </g> </g> </svg> </div>  <div class="vzb-ts-btns"> <button class="vzb-ts-btn-play vzb-ts-btn"> <svg class="vzb-icon vzb-icon-play" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1576 927l-1328 738q-23 13-39.5 3t-16.5-36v-1472q0-26 16.5-36t39.5 3l1328 738q23 13 23 31t-23 31z"/></svg> </button> <button class="vzb-ts-btn-pause vzb-ts-btn"> <svg class="vzb-icon vzb-icon-pause" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1664 192v1408q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h512q26 0 45 19t19 45zm-896 0v1408q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h512q26 0 45 19t19 45z"/></svg> </button> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/barchart/barchart.html');s.innerHTML = ' <svg class="vzb-barchart"> <g class="vzb-bc-graph"> <g class="vzb-bc-bars"></g> <g class="vzb-bc-bar-labels"></g> <text class="vzb-bc-axis-y-title"></text> <g class="vzb-bc-axis-x"></g> <g class="vzb-bc-axis-y"></g> <g class="vzb-bc-axis-labels">  </g> </g> </svg>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/bubblechart/bubblechart.html');s.innerHTML = ' <div class="vzb-bubblechart"> <svg class="vzb-bubblechart-svg"> <g class="vzb-bc-graph"> <text class="vzb-bc-year"></text> <svg class="vzb-bc-axis-x"><g></g></svg> <svg class="vzb-bc-axis-y"><g></g></svg> <line class="vzb-bc-projection-x"></line> <line class="vzb-bc-projection-y"></line> <svg class="vzb-bc-bubbles-crop"> <g class="vzb-bc-trails"></g> <g class="vzb-bc-bubbles"></g> <g class="vzb-bc-labels"></g> </svg> <g class="vzb-bc-axis-y-title"></g> <g class="vzb-bc-axis-x-title"></g> <g class="vzb-bc-axis-s-title"></g> <g class="vzb-bc-axis-c-title"></g> <rect class="vzb-bc-zoomRect"></rect> </g> <filter id="vzb-bc-blur-effect"> <feGaussianBlur stdDeviation="2" /> </filter> </svg>  <div class="vzb-tooltip vzb-hidden"></div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/linechart/linechart.html');s.innerHTML = ' <div class="vzb-linechart"> <svg class="vzb-lc-graph"> <g> <g class="vzb-lc-axis-x"></g> <text class="vzb-lc-axis-x-value"></text> <text class="vzb-lc-axis-y-value"></text> <svg class="vzb-lc-lines"></svg> <g class="vzb-lc-axis-y"></g> <line class="vzb-lc-projection-x"></line>; <line class="vzb-lc-projection-y"></line>; <g class="vzb-lc-labels"> <line class="vzb-lc-vertical-now"></line>; </g> <g class="vzb-lc-axis-y-title"></g> </g>  </svg> <div class="vzb-tooltip vzb-hidden"></div> </div>';root.document.body.appendChild(s);}).call(this);
/*!
 * VIZABI BUBBLE OPACITY CONTROL
 * Reusable OPACITY SLIDER
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.extend('gapminder-bubbleopacity', {

        init: function(config, context) {
            this.template = '<div class="vzb-bo-holder"><input type="range" id="vzb-bo-slider" class="vzb-bo-slider" step="1"></div>';

            this.model_expects = [{
                name: "entities",
                type: "entities"
            }];
            
            var _this = this;
            
            this.arg = config.arg;
            
            this.model_binds = {
                "change:entities:select": function(evt) {
                    _this.updateView();
                }
            }    
            this.model_binds["change:entities:" + this.arg] = function(evt) {
                    _this.updateView();
                }
            
            

            //contructor is the same as any component
            this._super(config, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
            this.slider = this.element.selectAll('#vzb-bo-slider');

            this.slider
                .attr('min', 0)
                .attr('max', 1)
                .attr('step', 0.1)
                .on('input', function() {
                    _this._setModel();
                });
            
            this.updateView();
        },

        updateView: function () {
            var someSelected = this.model.entities.select.length;
            var value = this.model.entities[this.arg];
            
            this.slider.attr('value', value);
        },
        
        _setModel: function () {
            this.model.entities[this.arg] = +d3.event.target.value;
        }
        
    });


}).call(this);
/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    var min = 1, max = 100;

    Vizabi.Component.extend('gapminder-bubblesize', {

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = this.template || "src/components/_gapminder/bubblesize/bubblesize.html";
            
            this.model_expects = [{
                name: "size",
                type: "size"
            }];

            //contructor is the same as any component
            this._super(config, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        readyOnce: function() {
            var value = this.model.size.max,
                _this = this;
            this.element = d3.select(this.element);
            this.indicatorEl = this.element.select('#vzb-bs-indicator');
            this.sliderEl = this.element.selectAll('#vzb-bs-slider');

            this.sliderEl
                .attr('min', 0)
                .attr('max', 1)
                .attr('step', 0.01)
                .attr('value', value)
                .on('input', function() {
                    _this.slideHandler();
                });
        },

        /**
         * Executes everytime there's a data event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        modelReady: function() {
            this.indicatorEl.text(this.model.size.max);
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            //E.g: var height = this.placeholder.style('height');
        },

        slideHandler: function() {
            this._setValue(+d3.event.target.value);
        },

        /**
         * Sets the current value in model. avoid updating more than once in framerate
         * @param {number} value 
         */
        _setValue: function(value) {
            var frameRate = 50;

            //implement throttle
            var now = new Date();
            if (this._updTime != null && now - this._updTime < frameRate) return;
            this._updTime = now;

            this.model.size.max = value;
        }
    });

}).call(this);
/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var Promise = Vizabi.Promise;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    //default existing buttons
    var class_active = "vzb-active";
    var class_unavailable = "vzb-unavailable";
    var class_vzb_fullscreen = "vzb-force-fullscreen";

    Vizabi.Component.extend('gapminder-buttonlist', {

        /**
         * Initializes the buttonlist
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, context) {

            //set properties
            var _this = this;
            this.name = 'buttonlist';
            this.template = '<div class="vzb-buttonlist"></div>';

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

            this._available_buttons = {
                'find': {
                    title: "buttons/find",
                    icon: "search",
                    dialog: true
                },
                'moreoptions': {
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
                'axes': {
                    title: "buttons/axes",
                    icon: "axes",
                    dialog: true
                },
                '_default': {
                    title: "Button",
                    icon: "asterisk",
                    dialog: false
                }
            };

            this._active_comp = false;
            
            this.model_binds = {
                "change:state:entities:select": function() {
                    if(!_this._readyOnce) return;
                    
                    if(_this.model.state.entities.select.length === 0){
                        _this.model.state.time.lockNonSelected = 0;
                    }
                    _this.setBubbleTrails();
                    _this.setBubbleLock();
                    
                    
                    //scroll button list to end if bottons appeared or disappeared
                    if(_this.entitiesSelected_1 !== (_this.model.state.entities.select.length>0)){
                        _this.scrollToEnd();
                    }
                    _this.entitiesSelected_1 = _this.model.state.entities.select.length>0;
                }
            }

            this._super(config, context);

        },

        readyOnce: function()  {

            var _this = this;

            this.element = d3.select(this.element);
            this.buttonContainerEl = this.element.append("div")
                .attr("class", "vzb-buttonlist-container-buttons");
            this.dialogContainerEl = this.element.append("div")
                .attr("class", "vzb-buttonlist-container-dialogs");

            //add buttons and render components
            if(this.model.ui.buttons) {
                this._addButtons();
            }

            var buttons = this.element.selectAll(".vzb-buttonlist-btn");

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
                else if (btn_config.func) {
                    btn_config.func(id);
                }

            });

            var close_buttons = this.element.selectAll("[data-click='closeDialog']");
            close_buttons.on('click', function() {
                _this.closeAllDialogs();
            });

            //store body overflow
            this._prev_body_overflow = document.body.style.overflow;
            
            this.setBubbleTrails();
            this.setBubbleLock();
        },
        

        /*
         * adds buttons configuration to the components and template_data
         * @param {Array} button_list list of buttons to be added
         */
        _addButtons: function() {

            this._components_config = [];
            var button_list = this.model.ui.buttons;
            var details_btns = [];
            if(!button_list.length) return;
            //add a component for each button
            for (var i = 0; i < button_list.length; i++) {

                var btn = button_list[i];
                var btn_config = this._available_buttons[btn];

                //if it's a dialog, add component
                if (btn_config && btn_config.dialog) {
                    var comps = this._components_config;
                    
                    //add corresponding component
                    comps.push({
                        component: 'gapminder-buttonlist-' + btn,
                        placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]',
                        model: ["state", "ui", "language"]
                    });

                    btn_config.component = comps.length - 1;
                }

                //add template data
                var d = (btn_config) ? btn : "_default";
                var details_btn = this._available_buttons[d];

                details_btn.id = btn;
                details_btn.icon = this._icons[details_btn.icon];
                details_btns.push(details_btn);
            };

            var t = this.getTranslationFunction(true);

            this.buttonContainerEl.selectAll('button').data(details_btns)
                .enter().append("button")
                .attr('class', 'vzb-buttonlist-btn')
                .attr('data-btn', function(d) { return d.id; })
                .html(function(btn) {
                    return "<span class='vzb-buttonlist-btn-icon fa'>"+
                            btn.icon +"</span><span class='vzb-buttonlist-btn-title'>"+
                            t(btn.title) +"</span>";
                });

            this.dialogContainerEl.selectAll('div').data(details_btns)
                .enter().append("div")
                .attr('class', 'vzb-buttonlist-dialog')
                .attr('data-btn', function(d) { return d.id; });

            this.loadComponents();

            var _this = this;
            //render each subcomponent
            utils.forEach(this.components, function(subcomp) {
                subcomp.render();
                _this.on('resize', function() {
                    subcomp.trigger('resize');
                });
            });
        },
        
        
        scrollToEnd: function(){
            var target = 0;
            var parent = d3.select(".vzb-tool");
            
            if(parent.classed("vzb-portrait") && parent.classed("vzb-small") ){
                if(this.model.state.entities.select.length>0) target = this.buttonContainerEl[0][0].scrollWidth
                this.buttonContainerEl[0][0].scrollLeft = target;
            }else{
                if(this.model.state.entities.select.length>0) target = this.buttonContainerEl[0][0].scrollHeight
                this.buttonContainerEl[0][0].scrollTop = target;
            }
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

        toggleBubbleTrails: function() {
            this.model.state.time.trails = !this.model.state.time.trails;
            this.setBubbleTrails();
        },
        setBubbleTrails: function() {
            var id = "trails";
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            
            btn.classed(class_active, this.model.state.time.trails);
            btn.style("display", this.model.state.entities.select.length == 0? "none": "inline-block")
        },
        toggleBubbleLock: function(id) {
            if(this.model.state.entities.select.length == 0) return;
            
            var timeFormatter = d3.time.format(this.model.state.time.formatInput);
            var locked = this.model.state.time.lockNonSelected;
            locked = locked?0:timeFormatter(this.model.state.time.value);
            this.model.state.time.lockNonSelected = locked;
            
            this.setBubbleLock();
        },
        setBubbleLock: function() {
            var id = "lock";
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            var translator = this.model.language.getTFunction();
            
            var locked = this.model.state.time.lockNonSelected;
            
            btn.classed(class_unavailable, this.model.state.entities.select.length == 0);
            btn.style("display", this.model.state.entities.select.length == 0? "none": "inline-block")
            
            btn.classed(class_active, locked)
            btn.select(".vzb-buttonlist-btn-title")
                .text(locked?locked:translator("buttons/lock"));
            
            btn.select(".vzb-buttonlist-btn-icon")
                .html(this._icons[locked?"lock":"unlock"]);
        },
        toggleFullScreen: function(id) {

            var component = this;
            var pholder = component.placeholder;
            var pholder_found = false;
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            var fs = !this.model.ui.fullscreen;
            var body_overflow = (fs) ? "hidden" : this._prev_body_overflow;

            while (!(pholder_found = utils.hasClass(pholder, 'vzb-placeholder'))) {
                component = this.parent;
                pholder = component.placeholder;
            };

            //TODO: figure out a way to avoid fullscreen resize delay in firefox
            if (fs) {
                launchIntoFullscreen(pholder);    
            } else {
                exitFullscreen();
            }

            utils.classed(pholder, class_vzb_fullscreen, fs);
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
                event = root.document.createEvent("HTMLEvents");
                event.initEvent("resize", true, true);
                event.eventName = "resize";
                root.dispatchEvent(event);
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
            'unexpand': '<svg class="vzb-icon vzb-icon-unexpand" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 960v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45zm755-672q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23z"/></svg>',
            'axes': '<svg class="vzb-icon vzb-icon-axes" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path d="M430.25,379.655l-75.982-43.869v59.771H120.73V151.966h59.774l-43.869-75.983L92.767,0L48.898,75.983L5.029,151.966h59.775 v271.557c0,15.443,12.52,27.965,27.963,27.965h261.5v59.773l75.982-43.869l75.982-43.867L430.25,379.655z"/></svg>',
            'gear': '<svg class="vzb-icon vzb-icon-gear" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>'
    
        }

    });

    function launchIntoFullscreen(elem) {
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

}).call(this);
/*!
 * VIZABI DIALOG
 * Reusable Dialog component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    Vizabi.Component.extend('gapminder-buttonlist-dialog', {
        /**
         * Initializes the dialog
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} parent Reference to tool
         */
        init: function(config, parent) {
            this.name = this.name || '';

            this.model_expects = this.model_expects || [{
                name: "state",
                type: "model"
            }, {
                name: "ui",
                type: "model"
            }, {
                name: "language",
                type: "language"
            }];
            
            this.template = 'src/components/_gapminder/buttonlist/'+
                            'dialogs/'+this.name+'/'+this.name+'.html';

            this._super(config, parent);
        },

        /**
         * Executed when the dialog has been rendered
         */
        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
        },

        /**
         * User has clicked to open this dialog
         */
        open: function() {
            //placeholder function
        },

        /**
         * User has closed this dialog
         */
        close: function() {
            //placeholder function
        }

    });

}).call(this);
(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    
    Vizabi.Component.register('gapminder-buttonlist-axes', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'axes';
            var _this = this;

            this.components = [{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-xaxis-container',
                model: ["state.marker.axis_x", "language"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-yaxis-container',
                model: ["state.marker.axis_y", "language"]
            },{
                component: 'gapminder-simplecheckbox',
                placeholder: '.vzb-axes-options',
                model: ["state", "language"],
                submodel: 'time',
                checkbox: 'adaptMinMaxZoom'
            }];

            this._super(config, parent);
        }
    }));

}).call(this);


/*!
 * VIZABI COLOR DIALOG
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.register('gapminder-buttonlist-colors', Dialog.extend({
        
    	/**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'colors';
            
            this.components = [{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
                component: 'gapminder-colorlegend',
                placeholder: '.vzb-clegend-container',
                model: ["state.marker.color", "state.entities", "language"]
            }];
            
            
            this._super(config, parent);
        }
        
    }));


}).call(this);
/*!
 * VIZABI FIND CONTROL
 * Reusable find dialog
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.register('gapminder-buttonlist-find', Dialog.extend({

        init: function(config, parent) {
            this.name = 'find';
            var _this = this;
            
            this.components = [{
                component: 'gapminder-bubbleopacity',
                placeholder: '.vzb-dialog-bubbleopacity',
                model: ["state.entities"],
                arg: "opacitySelectDim"
            }];
            
            this.model_binds = {
                "change:state:entities:select": function(evt) {
                    _this.update();
                },
                "ready": function(evt) {
                    if(!_this._readyOnce) return;
                    _this.update();
                }
            }
            
            this._super(config, parent);
        },

        /**
         * Grab the list div
         */
        readyOnce: function() {
            this.element = d3.select(this.element);
            this.list = this.element.select(".vzb-find-list");
            this.input_search = this.element.select("#vzb-find-search");
            this.deselect_all = this.element.select("#vzb-find-deselect");
            this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

            var _this = this;
            this.input_search.on("input", function() {
                _this.showHideSearch();
            });

            this.deselect_all.on("click", function() {
                _this.deselectEntities();
            });

            this._super();
            
            this.update();
        },

        open: function() {
            this.input_search.node().value = "";
            this.showHideSearch();
        },

        /**
         * Build the list everytime it updates
         */
        //TODO: split update in render and update methods
        update: function() {
            var _this = this;
            var selected = this.model.state.entities.getSelected();
            var labelModel = this.model.state.marker.label;
            var data = labelModel.getItems().map(function(d) {
                return {
                    geo: d["geo"],
                    name: labelModel.getValue(d)
                };
            });

            //sort data alphabetically
            data.sort(function(a, b) {
                return (a.name < b.name) ? -1 : 1;
            });

            this.list.html("");

            var items = this.list.selectAll(".vzb-find-item")
                .data(data)
                .enter()
                .append("div")
                .attr("class", "vzb-find-item vzb-dialog-checkbox")

            items.append("input")
                .attr("type", "checkbox")
                .attr("class", "vzb-find-item")
                .attr("id", function(d) {
                    return "-find-" + d.geo;
                })
                .property("checked", function(d) {
                    return (selected.indexOf(d.geo) !== -1);
                })
                .on("change", function(d) {
                    _this.model.state.entities.selectEntity(d);
                });

            items.append("label")
                .attr("for", function(d) {
                    return "-find-" + d.geo;
                })
                .text(function(d) {
                    return d.name;
                })
                .on("mouseover", function(d) {
                    _this.model.state.entities.highlightEntity(d);
                })
                .on("mouseout", function(d) {
                    _this.model.state.entities.clearHighlighted();
                });

            this.showHideSearch();
            this.showHideDeselect();
        },

        showHideSearch: function() {

            var search = this.input_search.node().value || "";
            search = search.toLowerCase();

            this.list.selectAll(".vzb-find-item")
                     .classed("vzb-hidden", function(d) {
                        var lower = d.name.toLowerCase();
                        return (lower.indexOf(search) === -1);
                     });
        },

        showHideDeselect: function() {
            var someSelected = !!this.model.state.entities.select.length;
            this.deselect_all.classed('vzb-hidden', !someSelected);
            this.opacity_nonselected.classed('vzb-hidden', !someSelected);
        },

        deselectEntities: function() {
            this.model.state.entities.clearSelected();
        }
        
    }));


}).call(this);
(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    
    Vizabi.Component.register('gapminder-buttonlist-moreoptions', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'moreoptions';

            this.components = [{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-xaxis-container',
                model: ["state.marker.axis_x", "language"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-yaxis-container',
                model: ["state.marker.axis_y", "language"]
            },{
                component: 'gapminder-simplecheckbox',
                placeholder: '.vzb-axes-options',
                model: ["state", "language"],
                submodel: 'time',
                checkbox: 'adaptMinMaxZoom'
            },{
                component: 'gapminder-bubblesize',
                placeholder: '.vzb-dialog-bubblesize',
                model: ["state.marker.size"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
                component: 'gapminder-colorlegend',
                placeholder: '.vzb-clegend-container',
                model: ["state.marker.color", "state.entities", "language"]
            },{
                component: 'gapminder-bubbleopacity',
                placeholder: '.vzb-dialog-bubbleopacity-regular',
                model: ["state.entities"],
                arg: "opacityRegular"
            },{
                component: 'gapminder-bubbleopacity',
                placeholder: '.vzb-dialog-bubbleopacity-selectdim',
                model: ["state.entities"],
                arg: "opacitySelectDim"
            }];
            
            this._super(config, parent);
        },
        
        readyOnce: function() {
            this.element = d3.select(this.element);
        }
    }));

}).call(this);

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    Vizabi.Component.register('gapminder-buttonlist-size', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'size';

            // in dialog, this.model_expects = ["state", "data"];

            this.components = [{
                component: 'gapminder-bubblesize',
                placeholder: '.vzb-dialog-bubblesize',
                model: ["state.marker.size"],
                ui: {
                    show_button: false
                }
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"],
                ui: {selectIndicator: true, selectScaletype: false}
            }];

            this._super(config, parent);
        }
    }));

}).call(this);
/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var INDICATOR = "which";

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.extend('gapminder-colorlegend', {
        
        init: function(config, context) {
            var _this = this;
            this.template = '<div class="vzb-cl-holder"></div>';
            
            this.model_expects = [{
                name: "color",
                type: "color"
            },{
                name: "entities",
                type: "entities"
            },{
                name: "language",
                type: "language"
            }];
            
            this.needsUpdate = false;
            this.which_1 = false;
            this.scaleType_1 = false;
            
            this.model_binds = {
                "change:color": function(evt) {
                    if(_this.model.color.which != _this.which_1 
                       || _this.model.color.scaleType != _this.scaleType_1 ) {
                        _this.needsUpdate = true;
                        _this.which_1 = _this.model.color.which;
                        _this.scaleType_1 = _this.model.color.scaleType;
                    }
                },
                "change:language": function(evt) {
                    _this.updateView();
                },
                "ready": function(evt) {
                    if(!_this._readyOnce) return;
                    if(_this.needsUpdate){
                        _this.updateView();
                        _this.needsUpdate = false;
                    }
                }   
            }
            
            //contructor is the same as any component
            this._super(config, context);
        },


        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
            this.listColorsEl = this.element.append("div").attr("class", "vzb-cl-colorList");
            this.rainbowEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow");
            this.worldmapEl = this.listColorsEl.append("div").attr("class", "vzb-cl-worldmap");
            
            this.colorPicker = d3.svg.colorPicker();
            this.element.call(this.colorPicker);
            
            this.worldMap = d3.svg.worldMap();
            this.worldmapEl.call(this.worldMap);
            
            this.updateView();
        },
        

        
        updateView: function(){
            var _this = this;
            this.translator = this.model.language.getTFunction();

            var palette = this.model.color.palette;
            
            
            var whichPalette = "_default";
            if(Object.keys(this.model.color.getPalettes()).indexOf(this.model.color[INDICATOR]) > -1) {
                whichPalette = this.model.color[INDICATOR];
            }
            
            var paletteDefault = this.model.color.getPalettes()[whichPalette];
            

            var colors = this.listColorsEl
                .selectAll(".vzb-cl-option")
                .data(utils.keys(paletteDefault), function(d){return d});

            colors.exit().remove();
            
            colors.enter().append("div").attr("class", "vzb-cl-option")
                .each(function(){
                    d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
                    d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
                })
                .on("mouseover", function(){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "5px");
                    sample.style("background-color", "transparent");

                })
                .on("mouseout", function(d){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "0px");
                    sample.style("background-color", _this.model.color.palette[d]);
                })
                .on("click", function(d){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                
                    _this.colorPicker
                        .colorOld(palette[d])
                        .colorDef(paletteDefault[d])
                        .callback(function(value){_this.model.color.setColor(value, d)})
                        .show(true);
                })
            
            
            if(this.model.color.use == "indicator"){
                this.rainbowEl.classed("vzb-hidden", false)
                    .style("height", (utils.keys(paletteDefault).length * 25 + 5) + "px")
                    .style("background", "linear-gradient(" + utils.values(palette._data).join(", ") +")");
            }else{
                this.rainbowEl.classed("vzb-hidden", true);
            }
            
            if(this.model.color[INDICATOR] == "geo.region"){
                var regions = this.worldmapEl.classed("vzb-hidden", false)
                    .select("svg").selectAll("g");
                regions.each(function(){
                    var view = d3.select(this);
                    var color = palette[view.attr("id")];
                    view.selectAll("path").style("fill",color);
                })
                .style("opacity", 0.8)
                .on("mouseover", function(){
                    var view = d3.select(this);
                    var region = view.attr("id");
                    regions.selectAll("path").style("opacity",0.5);
                    view.selectAll("path").style("opacity",1);
                    
                    
                    //TODO: accessing _filtered is an ugly hack. should be optimised later
                    var highlight = utils.values(_this.model.color._filtered)
                        //returns a function over time. pick the last time-value
                        .map(function(d){return d[d.length-1]})
                        //filter so that only countries of the correct region remain 
                        .filter(function(f){return f["geo.region"]==region})
                        //fish out the "geo" field, leave the rest behind
                        .map(function(d){return {geo: d.geo}});
                    
                    _this.model.entities.setHighlighted(highlight);
                })
                .on("mouseout", function(){
                    regions.selectAll("path").style("opacity",0.8);
                    _this.model.entities.clearHighlighted(); 
                })
                .on("click", function(d){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                    var view = d3.select(this);
                    var region = view.attr("id")
                    
                    _this.colorPicker
                        .colorOld(palette[region])
                        .colorDef(paletteDefault[region])
                        .callback(function(value){_this.model.color.setColor(value, region)})
                        .show(true);
                })
                colors.classed("vzb-hidden", true);
            }else{
                this.worldmapEl.classed("vzb-hidden", true);
                colors.classed("vzb-hidden", false);
            }
            
            colors.each(function(d, index){
                d3.select(this).select(".vzb-cl-color-sample")
                    .style("background-color", palette[d])
                    .style("border", "1px solid " + palette[d]);

                if(_this.model.color.use == "indicator"){
                    var domain = _this.model.color.getScale().domain();
                    d3.select(this).select(".vzb-cl-color-legend")
                        .text(_this.model.color.tickFormatter(domain[index]))
                }else{
                    
                    d3.select(this).select(".vzb-cl-color-legend")
                        .text(_this.translator("color/" + _this.model.color[INDICATOR] + "/" + d));
                }
            });
        }
        

    });


}).call(this);
/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    var INDICATOR = "which";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    var availOpts = {
        'geo.region': {use: 'property',unit: '',scales: ['ordinal']},
        'geo': {use: 'property',unit: '',scales: ['ordinal']},
        'time': {use: 'indicator',unit: 'year',scales: ['time']},
        'lex': {use: 'indicator',unit: 'years',scales: ['linear']},
        'gdp_per_cap': {use: 'indicator',unit: '$/year/person',scales: ['log', 'linear']},
        'pop': {use: 'indicator',unit: '',scales: ['linear', 'log']},
        '_default': {use: 'value',unit: '',scales: ['linear', 'log']}
    };

    Vizabi.Component.extend('gapminder-indicatorpicker', {

        /**
         * Initializes the Indicator Picker.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {

            this.template = '<span class="vzb-ip-holder"><select class="vzb-ip-indicator"></select><select class="vzb-ip-scaletype"></select></span>';
            var _this = this;

            this.model_expects = [{
                name: "axis"
                    //TODO: learn how to expect model "axis" or "size" or "color"
            }, {
                name: "language",
                type: "language"
            }];


            this.model_binds = {
                "change:axis": function(evt) {
                    _this.updateView();
                },
                "change:language": function(evt) {
                    _this.updateView();
                }
            }

            //contructor is the same as any component
            this._super(config, context);

            this.ui = utils.extend({
                selectIndicator: true,
                selectScaletype: true
            }, this.ui);

        },

        ready: function() {
            this.updateView();
        },

        readyOnce: function() {
            var _this = this;

            this.element = d3.select(this.element);
            this.el_select_indicator = this.element.select('.vzb-ip-indicator');
            this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');

            this.el_select_indicator
                .on("change", function() {
                    _this._setModel(INDICATOR, this.value)
                });

            this.el_select_scaletype
                .on("change", function() {
                    _this._setModel(SCALETYPE, this.value)
                });
        },

        updateView: function() {
            var _this = this;
            this.translator = this.model.language.getTFunction();

            var pointer = "_default";

            var data = {};
            data[INDICATOR] = Object.keys(availOpts);

            if (data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];

            data[SCALETYPE] = availOpts[pointer].scales;

            //bind the data to the selector lists
            var elOptionsIndicator = this.el_select_indicator.selectAll("option")
                .data(data[INDICATOR], function(d) {
                    return d
                });
            var elOptionsScaletype = this.el_select_scaletype.selectAll("option")
                .data(data[SCALETYPE], function(d) {
                    return d
                });

            //remove irrelevant options
            elOptionsIndicator.exit().remove();
            elOptionsScaletype.exit().remove();

            //populate options into the list
            elOptionsIndicator.enter().append("option")
                .attr("value", function(d) {
                    return d
                });
            elOptionsScaletype.enter().append("option")
                .attr("value", function(d) {
                    return d
                });

            //show translated UI string
            elOptionsIndicator.text(function(d) {
                return _this.translator("indicator/" + d)
            })
            elOptionsScaletype.text(function(d) {
                return _this.translator("scaletype/" + d)
            })

            //set the selected option
            this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
            this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];

            //disable the selector in case if there is only one option, hide if so requested by the UI setings
            this.el_select_indicator
                .style('display', this.ui.selectIndicator ? "auto" : "none")
                .attr('disabled', data[INDICATOR].length <= 1 ? "true" : null)
            this.el_select_scaletype
                .style('display', this.ui.selectScaletype ? "auto" : "none")
                .attr('disabled', data[SCALETYPE].length <= 1 ? "true" : null)
        },

        _setModel: function(what, value) {

            var mdl = this.model.axis;

            var obj = {};
            obj[what] = value;

            if (what == INDICATOR) {
                obj.use = availOpts[value].use;
                obj.unit = availOpts[value].unit;

                if (availOpts[value].scales.indexOf(mdl.scaleType) == -1) {
                    obj.scaleType = availOpts[value].scales[0];
                }
            }

            mdl.set(obj);
        }

    });

}).call(this);
/*!
 * VIZABI SIMPLE CHECKBOX
 * Reusable simple checkbox component
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.extend('gapminder-simplecheckbox', {

        init: function(config, context) {
            this.template = '<span class="vzb-sc-holder vzb-dialog-checkbox"><input type="checkbox"><label></label></span>';
            var _this = this;
            
            this.checkbox = config.checkbox;
            this.submodel = config.submodel;

            this.model_expects = [{
                name: "mdl"
                //TODO: learn how to expect model "axis" or "size" or "color"
            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "change:language": function(evt) {
                    _this.updateView();
                }
            }
            
            this.model_binds["change:mdl:"+this.submodel+":"+this.checkbox] = function() {
                _this.updateView();
            };

            //contructor is the same as any component
            this._super(config, context);
        },

        ready: function() {
            this.updateView();
        },

        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
            var id = "-check-" + Math.random()*1000;
            this.labelEl = this.element.select('label').attr("for", id);
            this.checkEl = this.element.select('input').attr("id", id)
                .on("change", function(){
                    _this._setModel(d3.select(this).property("checked"));
                });
        },

        updateView: function() {
            this.translator = this.model.language.getTFunction();
            this.labelEl.text(this.translator("check/" + this.checkbox));
            this.checkEl.property("checked", !!this.model.mdl[this.submodel][this.checkbox]);
        },
        
        _setModel: function (value) {
            this.model.mdl[this.submodel][this.checkbox] = value;
        }
        
    });


}).call(this);
/*!
 * VIZABI TIMESLIDER
 * Reusable timeslider component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var Promise = Vizabi.Promise;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    //constants
    var class_playing = "vzb-playing";
    var class_hide_play = "vzb-ts-hide-play-button";
    var class_dragging = "vzb-ts-dragging";
    var class_axis_aligned = "vzb-ts-axis-aligned";
    var class_show_value = "vzb-ts-show-value";
    var class_show_value_when_drag_play = "vzb-ts-show-value-when-drag-play";

    var time_formats = {
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%b"),
        "week": d3.time.format("week %U"),
        "day": d3.time.format("%d/%m/%Y"),
        "hour": d3.time.format("%d/%m/%Y %H"),
        "minute": d3.time.format("%d/%m/%Y %H:%M"),
        "second": d3.time.format("%d/%m/%Y %H:%M:%S")
    };

    //margins for slider
    var profiles = {
        small: {
            margin: { top: 9, right: 15, bottom: 10, left: 15 },
            radius: 8,
            label_spacing: 10
        },
        medium: {
            margin: { top: 9, right: 15, bottom: 10, left: 15 },
            radius: 10,
            label_spacing: 12
        },
        large: {
            margin: { top: 9, right: 15, bottom: 10, left: 15 },
            radius: 11,
            label_spacing: 14
        }
    };

    Vizabi.Component.extend("gapminder-timeslider", {
        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = this.template || "src/components/_gapminder/timeslider/timeslider.html";

            //define expected models/hooks for this component
            this.model_expects = [{
                name: "time",
                type: "time"
            }];

            var _this = this;

            //binds methods to this model
            this.model_binds = {
                'change:time': function(evt, original) {
                    if((['change:time:start','change:time:end']).indexOf(evt) !== -1) {
                        _this.changeLimits();
                    }
                    _this.changeTime();
                    var transition = _this.model.time.playing;
                    _this._setHandle(transition);
                }
            };

            this.ui = utils.extend({
                show_limits: false,
                show_value: false,
                show_value_when_drag_play: true,
                show_button: true,
                class_axis_aligned: false
            }, config.ui, this.ui);

            // Same constructor as the superclass
            this._super(config, context);


            //defaults
            this.width = 0;
            this.height = 0;
        },

        //template is ready
        readyOnce: function() {
            var _this = this;

            //DOM to d3
            this.element = d3.select(this.element);

            //html elements
            this.slider_outer = this.element.select(".vzb-ts-slider");
            this.slider = this.slider_outer.select("g");
            this.axis = this.element.select(".vzb-ts-slider-axis");
            this.slide = this.element.select(".vzb-ts-slider-slide");
            this.handle = this.slide.select(".vzb-ts-slider-handle");
            this.valueText = this.slide.select('.vzb-ts-slider-value');

            //Scale
            this.xScale = d3.time.scale()
                .clamp(true);
            //Axis
            this.xAxis = d3.svg.axis()
                .orient("bottom")
                .tickSize(0);

            //Value
            this.valueText.attr("text-anchor", "middle").attr("dy", "-1em");

            var brushed = _this._getBrushed(),
                brushedEnd = _this._getBrushedEnd();

            //Brush for dragging
            this.brush = d3.svg.brush()
                .x(this.xScale)
                .extent([0, 0])
                .on("brush", function() {
                    utils.throttle(brushed.bind(this), 10);
                })
                .on("brushend", function() {
                    utils.throttle(brushedEnd.bind(this), 10);
                });

            //Slide
            this.slide.call(this.brush);
            this.slide.selectAll(".extent,.resize")
                .remove();

            
            this.parent.on('myEvent', function(evt, arg, mright) {
                

                // set the right margin that depends on longest label width
                _this.element.select(".vzb-ts-slider-wrapper")
                    .style("right", mright+"px");

                profiles[_this.getLayoutProfile()].margin = 
                    {bottom: 0, left: 0, right: 0, top: 0};

                _this.xScale.range([0, arg]);
                _this.resize();
            });

            var _this = this;

        },

        //template and model are ready
        ready: function() {

            var play = this.element.select(".vzb-ts-btn-play");
            var pause = this.element.select(".vzb-ts-btn-pause");
            var _this = this;

            play.on('click', function() {
                _this.model.time.play();
            });

            pause.on('click', function() {
                _this.model.time.pause();
            });//format

            this.format = time_formats[this.model.time.unit];
            this.changeLimits();
            this.changeTime();
            this.resize();
            this._setHandle(this.model.time.playing);
        },

        changeLimits: function() {
            var minValue = this.model.time.start;
            var maxValue = this.model.time.end;
            //scale
            this.xScale.domain([minValue, maxValue]);
            //axis
            this.xAxis.tickValues([minValue, maxValue])
                .tickFormat(this.format);
        },

        changeTime: function() {
            this.ui.format = this.model.time.unit;
            //time slider should always receive a time model
            var time = this.model.time.value;
            //special classes
            this._optionClasses();
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {

            this.model.time.pause();

            this.profile = profiles[this.getLayoutProfile()];

            var slider_w = parseInt(this.slider_outer.style("width"), 10);
            var slider_h = parseInt(this.slider_outer.style("height"), 10);
            this.width = slider_w - this.profile.margin.left - this.profile.margin.right;
            this.height = slider_h - this.profile.margin.bottom - this.profile.margin.top;
            var _this = this;

            //translate according to margins
            this.slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top + ")");

            //adjust scale width if it was not set manually before
            if (this.xScale.range()[1] = 1) this.xScale.range([0, this.width]);

            //adjust axis with scale
            this.xAxis = this.xAxis.scale(this.xScale)
                .tickPadding(this.profile.label_spacing);

            this.axis.attr("transform", "translate(0," + this.height / 2 + ")")
                .call(this.xAxis);

            this.slide.select(".background")
                .attr("height", this.height);

            //size of handle
            this.handle.attr("transform", "translate(0," + this.height / 2 + ")")
                .attr("r", this.profile.radius);

            this._setHandle();

        },

        /**
         * Gets brushed function to be executed when dragging
         * @returns {Function} brushed function
         */
        _getBrushed: function() {
            var _this = this;
            return function() {
                _this.model.time.pause();

                if (!_this._blockUpdate) {
                    _this._optionClasses();
                    _this._blockUpdate = true;
                    _this.element.classed(class_dragging, true);
                }

                var value = _this.brush.extent()[0];
                //set brushed properties
                if (d3.event.sourceEvent) {
                    value = _this.xScale.invert(d3.mouse(this)[0]);
                }

                //set time according to dragged position
                if (value - _this.model.time.value !== 0) {
                    _this._setTime(value);
                }
                //position handle
                _this._setHandle(_this.model.time.playing);
            };
        },

        /**
         * Gets brushedEnd function to be executed when dragging ends
         * @returns {Function} brushedEnd function
         */
        _getBrushedEnd: function() {
            var _this = this;
            return function() {
                _this._blockUpdate = false;
                _this.model.time.pause();
                _this.element.classed(class_dragging, false);
                _this.model.time.snap();
            };
        },

        /**
         * Sets the handle to the correct position
         * @param {Boolean} transition whether to use transition or not
         */
        _setHandle: function(transition) {
            var value = this.model.time.value;
            this.slide.call(this.brush.extent([value, value]));

            this.valueText.text(this.format(value));

            var speed = this.model.time.speed;
            var old_pos = this.handle.attr("cx");
            var new_pos = this.xScale(value);

            if (transition) {
                this.handle.attr("cx", old_pos)
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("cx", new_pos);

                this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");

            } else {
                this.handle.attr("cx", new_pos);
                this.valueText.attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
            }
        },

        /**
         * Sets the current time model to time
         * @param {number} time The time
         */
        _setTime: function(time) {
            //update state
            var _this = this,
                frameRate = 50;

            //avoid updating more than once in "frameRate"
            var now = new Date();
            if (this._updTime != null && now - this._updTime < frameRate) return;
            this._updTime = now;

            _this.model.time.value = time;
        },

        /**
         * Applies some classes to the element according to options
         */
        _optionClasses: function() {
            //show/hide classes

            var show_limits = this.ui.show_limits;
            var show_value = this.ui.show_value;
            var show_value_when_drag_play = this.ui.show_value_when_drag_play;
            var axis_aligned = this.ui.axis_aligned;
            var show_play = (this.ui.show_button) && (this.model.time.playable);

            if (!show_limits) {
                this.xAxis.tickValues([]).ticks(0);
            }

            this.element.classed(class_hide_play, !show_play);
            this.element.classed(class_playing, this.model.time.playing);
            this.element.classed(class_show_value, show_value);
            this.element.classed(class_show_value_when_drag_play, show_value_when_drag_play);
            this.element.classed(class_axis_aligned, axis_aligned);
        }
    });

}).call(this);