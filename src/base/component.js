define([
    'jquery',
    'd3',
    'lodash',
    'base/utils',
    'base/class',
    'base/model',
    'base/events'
], function($, d3, _, utils, Class, Model, Events) {

    var class_loading = "vzb-loading";

    var Component = Class.extend({

        /**
         * Initializes the component
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} parent Reference to tool
         */
        init: function(config, parent) {

            this._id = this._id || _.uniqueId("c");
            this._rendered = false;
            this._ready = false;
            this._debugEvents = this._debugEvents || false;

            //default values,
            //in case there's none
            //TODO: evaluate what should be accessible or not
            this.name = this.name || config.name;
            this.template = this.template || config.template;
            this.placeholder = this.placeholder || config.placeholder;
            this.selector = this.placeholder;
            this.template_data = this.template_data || {
                name: this.name
            };
            this.intervals = this.intervals;
            this.components = this.components || [];
            this.parent = parent;

            this._events = new Events();
            this._components_config = this.components;
            this._frameRate = 10;

            //define expected models for this component
            this.model_expects = this.model_expects || [];
            this.model_binds = this.model_binds || {};

            this.ui = this.ui || config.ui;

            //set placeholder as d3 entity already
            if(_.isString(this.placeholder)) {
                this.placeholder = d3.select(this.placeholder);
            } else {
                console.error('ERROR: the placeholder argument should be a string');
            }

            var _this = this;
            this.on({
                'dom_ready': function() {
                    _this.domReady();

                    //TODO: hotfix for non-data viz
                    _.defer(function() {
                        if (_this.model._ready) {
                            _this.modelReady('dom_ready');
                        }
                    });
                },
                'resize': function() {
                    _this.resize();
                }
            });
        },

        /**
         * Renders the component, step by step - Assumes data is ready
         * @returns defer a promise to be resolved when component is rendered
         */
        render: function(posTemplate) {

            if (this._ready) return; //a component only renders once

            var defer = $.Deferred();
            var _this = this;

            // First, we load the template
            var promise = this.loadTemplate();

            // After the template is loaded, its loading data
            promise.then(function() {

                    // attempt to setup layout
                    if (_this.layout) {
                        _this.layout.setContainer(_this.element);
                        _this.layout.resize();
                        _this.layout.on('resize', function() {
                            _this.trigger('resize');
                        });
                    }

                    // add css loading class to hide elements
                    if (_this.element.node()) {
                        _this.element.classed(class_loading, true);
                    }

                    _this._rendered = true; //template is in place
                })
                // After load components
                .then(function() {
                    return _this.loadComponents();
                })
                // After loading components, render them
                .then(function() {
                    return _this.renderComponents();
                })
                // After rendering the components, resolve the defer
                .done(function() {
                    //this template is ready
                    defer.resolve();
                    _this.trigger('dom_ready');

                    //ready when model is also ready
                    _this.model.on("ready", function() {
                        _this._ready = true;

                        //TODO: delay is a hotfix to visually avoid flickering
                        _.delay(function() {
                            if (_this.element) {
                                _this.element.classed(class_loading, false);
                            }
                        });
                    });

                });

            return defer;
        },

        /**
         * Loads all subcomponents
         * @returns defer a promise to be resolved when components are loaded
         */
        loadComponents: function() {
            var defer = $.Deferred(),
                _this = this,
                promises = [],
                components = this.components;

            //save initial config
            this._components_config = _.map(components, _.clone);
            //use the same name for the initialized collection           
            this.components = [];

            // Loops through components, loading them.
            _.each(components, function(component) {
                var promise = _this.loadComponent(component)
                    .then(function(loaded_comp) {
                        _this.components.push(loaded_comp);
                    });
                promises.push(promise);
            });

            // When all components have been loaded, resolve the defer
            $.when.apply(null, promises).done(function() {
                defer.resolve();
            });

            return defer;
        },

        /**
         * Load component
         * @param {Object} component the configuration for a component
         * @returns defer a promise to be resolved when the component is loaded
         */
        loadComponent: function(component) {

            if (!component.component || !component.placeholder) {
                console.log("Error loading component");
                return true;
            }

            //name and path
            var _this = this,
                defer = $.Deferred(),
                path = component.component,
                name_token = path.split("/"),
                name = name_token[name_token.length - 1],
                id = component.placeholder,
                comp_path = "components/" + path + "/" + name,
                comp_model = component.model || [],
                comp_ui = this._uiMapping(id, component.ui);

            //component options
            var config = _.extend(component, {
                name: name,
                ui: comp_ui
            });

            // Loads the file we need
            require([comp_path], function(subcomponent) {
                //initialize subcomponent
                var c = new subcomponent(config, _this);
                //setup model later with expected models
                c.model = _this._modelMapping(c.name,
                    comp_model,
                    c.model_expects,
                    c.model_binds,
                    function() {
                        defer.resolve(c);
                    });
            });

            return defer;
        },

        /**
         * Renders subcomponents
         * @returns defer a promise to be resolved when components are rendered
         */
        renderComponents: function() {
            var defer = $.Deferred(),
                promises = [];

            // Loops through components, rendering them.
            _.each(this.components, function(component) {
                promises.push(component.render());
            });

            // After all components are rendered, resolve the defer
            $.when.apply(null, promises).done(function() {
                defer.resolve();
            });

            return defer;
        },

        /**
         * Loads the template
         * @returns defer a promise to be resolved when template is loaded
         */
        loadTemplate: function() {
            var _this = this;
            var defer = $.Deferred();

            //todo: improve t function getter + generalize this
            this.template_data = _.extend(this.template_data, {
                t: this.getTranslationFunction(true)
            });


            if (this.template) {
                //require the template file
                require(["text!" + this.template + ".html"], function(html) {
                    //render template using underscore
                    var rendered = _.template(html, _this.template_data);

                    var root = _this.parent.element || d3;
                    //place the contents into the correct placeholder
                    _this.placeholder = (_.isString(_this.selector)) ? root.select(_this.selector) : _this.placeholder;

                    //add placeholder identifiers
                    _this.placeholder.attr("data-component", "true");
                    _this.placeholder.html(rendered);

                    try {
                        var element = _this.placeholder.node().children[0];
                        _this.element = d3.select(element);

                        if (!_this.element.node()) {
                            console.warn("Component element not found (root HTML node in the component's markup). Verify that " + this.template + "contains valid HTML/template.");
                        }
                    } catch (err) {
                        console.warn("Placeholder div not found! Check the name of the placeholder for the component " + _this.template);
                    }

                    defer.resolve();
                });

            } else {
                defer.resolve();
            }

            return defer;
        },

        /**
         * Interface for domReady
         * To be called whenever the template is finally ready
         */
        domReady: function() {},

        /**
         * modelReady calls modelReady for all sub-components
         */
        modelReady: function(evt) {
            if (this._blockUpdate) return;
            var _this = this;
            this._modelReady = this._update || _.throttle(function() {
                _.each(_this.components, function(component) {
                    component.modelReady(evt);
                });
            }, this._frameRate);
            this._modelReady();
        },

        /**
         * Resize calls resize for all sub-components
         */
        resize: function() {
            if (this._blockResize) return;
            var _this = this;
            this._resize = this._resize || _.throttle(function() {
                _.each(_this.components, function(component) {
                    component.trigger('resize');
                });
            }, this._frameRate);
            this._resize();
        },

        /**
         * Blocks execution of update method
         * @param {Boolean} val
         */
        blockUpdate: function(val) {
            if (typeof val === 'undefined') val = true;
            this._blockUpdate = val;
        },

        /**
         * Blocks execution of resize method
         * @param {Boolean} val
         */
        blockResize: function(val) {
            if (typeof val === 'undefined') val = true;
            this._blockResize = val;
        },

        /**
         * Destroys component
         */
        destroy: function() {
            if (this.model) this.model.clear();
            if (this.layout) this.layout.destroy();
            if (this.intervals) this.intervals.clearAllIntervals();
            if (this._events) this._events.unbindAll();
            if (this.components) this.components = [];
            if (this.placeholder) this.placeholder.html('');
        },

        /**
         * Reassigns all models (on overwrite
         */
        //TODO: After changes in _modelMapping, this won't work. Fix it!
        reassignModel: function() {
            //only reassign if it's already initialized
            if (!this._ready) return;

            var _this = this;
            //for each subcomponent configuration, reassign model
            _.each(this._components_config, function(c, i) {
                var model = _this._modelMapping(c.name, c.model);
                if (model) {
                    _this.components[i].model = model;
                    _this.components[i].reassignModel();
                }
            });
        },

        /**
         * Maps the current model to the subcomponents
         * @param {String} subcomponent name of the subcomponent
         * @param {String|Array} model_config Configuration of model
         * @param {String|Array} model_expects Expected models
         * @param {Object} model_binds Initial model bindings
         * @returns {Object} the model
         */
        _modelMapping: function(subcomponent, model_config, model_expects, model_binds, ready) {

            var _this = this,
                values = {};

            //If model_config is an array, we map it
            if (_.isArray(model_config)) {

                //if there's a different number of models received and expected
                if (model_expects.length !== model_config.length) {
                    console.groupCollapsed("DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED");
                    console.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + this.name + "'\nSubcomponent: '" + subcomponent + "'\nNumber of Models Expected: " + model_expects.length + "\nNumber of Models Received: " + model_config.length);
                    console.groupEnd();
                }

                //map current submodels to new model
                for (var i = 0, s = model_config.length; i < s; i++) {
                    //get current model and rename if necessary
                    var model_info = _mapOne(model_config[i]),
                        new_name;

                    if (model_expects[i]) {
                        new_name = model_expects[i].name;

                        if (model_info.type !== model_expects[i].type) {

                            //TODO: add link to the documentation about model_expects
                            console.groupCollapsed("UNEXPECTED MODEL TYPE: '" + model_info.type + "' instead of '" + model_expects[i].type + "'");
                            console.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + this.name + "'\nSubcomponent: '" + subcomponent + "'\nExpected Model: '" + model_expects[i].type + "'\nReceived Model'" + model_info.type + "'\nModel order: " + i);
                            console.groupEnd();
                        }

                    } else {
                        //TODO: add link to the documentation about model_expects
                        console.groupCollapsed("UNEXPECTED MODEL: '" + model_config[i] + "'");
                        console.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + this.name + "'\nSubcomponent: '" + subcomponent + "'\nNumber of Models Expected: " + model_expects.length + "\nNumber of Models Received: " + model_config.length);
                        console.groupEnd();

                        new_name = model_info.name;
                    }

                    values[new_name] = model_info.model;
                }

                //check for remaining expected models
                var existing = model_config.length,
                    expected = model_expects.length;
                if (expected > existing) {
                    //skip existing
                    model_expects.splice(0, existing);
                    //adds new expected models if needed
                    for (var i = 0; i < expected; i++) {
                        //force new empty model
                        values[model_expects[i]] = {};
                    }
                }
            }

            //return a new model with the defined submodels
            var model = new Model(values, this.intervals, {
                //bind callback after model is all set
                'set': function() {
                    if (_.isFunction(ready)) {
                        ready();
                    }
                }
            });

            //binds init bindings to this model
            if (_.isPlainObject(model_binds)) {
                model.on(model_binds);
            };

            var _this = this,
                submodels = _.filter(model.get(), function(attr) {
                    return !_.isUndefined(attr._id);
                });

            for (var submodel in model.get()) {

                model[submodel].on({
                    //the submodel has been set (only once)
                    'set': function(evt, vals) {
                        //trigger only for submodel
                        evt = evt.replace('set', 'set:' + name);
                        model.trigger(evt, vals);

                        //if all are ready, trigger for this model
                        if (_.every(submodels, function(sm) {
                                return sm._set;
                            })) {
                            model.triggerOnce('set', vals);
                        }
                    },
                    //the submodel has initialized (only once)
                    'init': function(evt, vals) {
                        evt = evt.replace('init', 'init:' + name);
                        model.triggerAll(evt, model.getObject());
                    },
                    //the submodel has changed (multiple times)
                    'change': function(evt, vals) {
                        evt = evt.replace('change', 'change:' + name);
                        model.triggerAll(evt, model.getObject());
                    },
                    //loading has started in this submodel (multiple times)
                    'load_start': function(evt, vals) {
                        evt = evt.replace('load_start', 'load_start:' + name);
                        model.triggerAll(evt, vals);
                    },
                    //loading has failed in this submodel (multiple times)
                    'load_error': function(evt, vals) {
                        evt = evt.replace('load_error', 'load_error:' + name);
                        model.triggerAll(evt, vals);
                    },
                    //loading has ended in this submodel (multiple times)
                    'load_end': function(evt, vals) {
                        //trigger only for submodel
                        evt = evt.replace('load_end', 'load_end:' + name);
                        model.trigger(evt, vals);

                        //if all are ready, trigger for this model
                        if (_.every(submodels, function(sm) {
                                return !sm.isLoading();
                            })) {
                            model.triggerOnce('load_end', vals);
                        }
                    },
                    //the submodel is ready
                    'ready': function(evt, vals) {
                        //trigger only for submodel
                        evt = evt.replace('ready', 'ready:' + name);
                        model.trigger(evt, vals);

                        //if all are ready, trigger for this model
                        if (_.every(submodels, function(sm) {
                                return sm._ready;
                            })) {
                            model.triggerOnce('ready', vals);
                        }
                    }
                });

            }


            return model;

            /**
             * Maps one model name to current submodel and returns info
             * @param {String} name Full model path. E.g.: "state.marker.color"
             * @returns {Object} the model info, with name and the actual model
             */
            function _mapOne(name) {
                var parts = name.split("."),
                    current = _this.model,
                    current_name = "";
                while (parts.length) {
                    current_name = parts.shift();
                    current = current[current_name];
                }
                return {
                    name: name,
                    model: current,
                    type: current.getType()
                };
            }

        },

        /**
         * Maps the current ui to the subcomponents
         * @param {String} id subcomponent id (placeholder)
         * @param {Object} ui Optional ui parameters to overwrite existing
         * @returns {Object} the UI object
         */
        //todo: make it more powerful
        _uiMapping: function(id, ui) {

            //if overwritting UI
            if (ui) {
                return new Model(ui);
            }

            if (id && this.ui) {
                id = id.replace(".", ""); //remove trailing period
                var sub_ui = this.ui[id];
                if (sub_ui) {
                    return sub_ui;
                }
            }
            return this.ui;
        },

        /**
         * Get layout profile of the current resolution
         * @returns {String} profile
         */
        getLayoutProfile: function() {
            //get profile from parent if layout is not available
            if (this.layout) {
                return this.layout.currentProfile();
            } else {
                return this.parent.getLayoutProfile();
            }
        },

        /**
         * Get translation function for templates
         * @param {Boolean} wrap wrap in spam tags
         * @returns {Function}
         */
        getTranslationFunction: function(wrap) {
            var t_func;
            try {
                t_func = this.model.get("language").getTFunction();
            } catch (err) {
                if (this.parent && this.parent != this) {
                    t_func = this.parent.getTranslationFunction();
                }
            }

            if (!t_func) {
                t_func = function(s) {
                    return s;
                };
            }
            if (wrap) return this._translatedStringFunction(t_func);
            else return t_func;
        },

        /**
         * Get function for translated string
         * @param {Function} translation_function The translation function
         * @returns {Function}
         */
        _translatedStringFunction: function(translation_function) {
            return function(string) {
                var translated = translation_function(string);
                return '<span data-vzb-translate="' + string + '">' + translated + '</span>';
            }
        },

        /**
         * Translate all strings in the template
         */
        //TODO: improve translation of strings
        translateStrings: function() {
            var t = this.getTranslationFunction();
            var strings = this.placeholder.selectAll('[data-vzb-translate]');
            for (var i = 0; i < strings[0].length; i++) {
                var string = strings[0][i];
                var original = string.getAttribute("data-vzb-translate");
                string.innerHTML = t(original);
            }
        },

        /**
         * Loads data
         * @returns true assume it's loaded
         */
        loadData: function() {
            return true;
        },

        /*
         * Event binding methods
         */

        /**
         * Binds function to an event in this model
         * @param {String} name name of event
         * @param {Function} func function to be executed
         */
        on: function(name, func) {

            if (this._debugEvents && this._debugEvents !== "trigger") {
                if (_.isPlainObject(name)) {
                    for (var i in name) {
                        console.log("Component", this.name, "> bind:", i);
                    }
                } else if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Component", this.name, "> bind:", name[i]);
                    }
                } else {
                    console.log("Component", this.name, "> bind:", name);
                }
            }

            this._events.bind(name, func);
        },

        /**
         * Triggers an event from this model
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        trigger: function(name, val) {

            if (this._debugEvents && this._debugEvents !== "bind") {
                console.log("============================================")
                if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Component", this.name ,"> triggered:", name[i]);
                    }
                } else {
                    console.log("Component", this.name ,"> triggered:", name);
                }
                console.log('\n')
                console.info(utils.formatStacktrace(utils.stacktrace()));
                console.log("____________________________________________")
            }

            this._events.trigger(name, val);
        },

        /**
         * Triggers an event from this model and all parent events
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        triggerAll: function(name, val) {

            if (this._debugEvents && this._debugEvents !== "bind") {
                console.log("============================================")
                if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Component", this.name ,"> triggered all:", name[i]);
                    }
                } else {
                    console.log("Component", this.name ,"> triggered all:", name);
                }
                console.log('\n')
                console.info(utils.formatStacktrace(utils.stacktrace()));
                console.log("____________________________________________")
            }

            this._events.triggerAll(name, val);
        }

    });


    return Component;
});