define([
    'jquery',
    'd3',
    'underscore',
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

            //default values,
            //in case there's none
            this.name = this.name || config.name;
            this.template = this.template || config.template;
            this.placeholder = this.placeholder || config.placeholder;
            this.template_data = this.template_data || {
                name: this.name
            };
            this.components = this.components || [];
            this.profiles = this.profiles || {};
            this.parent = parent;

            this._events = new Events();
            this._components_config = this.components;
            this._frameRate = 10;

            //model
            this.model = this.model || config.model;
        },

        /**
         * Renders the component, step by step - Assumes data is ready
         * @returns defer a promise to be resolved when component is rendered
         */
        render: function(posTemplate) {
            var defer = $.Deferred();
            var _this = this;

            // First, we load the template
            var promise = this.loadTemplate();

            // After the template is loaded, its loading data
            promise.then(function() {
                    // attempt to setup layout
                    if (_this.layout) {
                        _this.layout.setContainer(_this.element);
                        _this.layout.setProfile(_this.profiles);
                        _this.layout.resize();
                        _this.layout.on('resize', function() {
                            _this.resize();
                        });
                    }
                    // add css loading class to hide elements
                    if (_this.element) {
                        _this.element.classed(class_loading, true);
                    }

                    _this._rendered = true; //template is in place

                })
                // After load components
                .then(function() {
                    return _this.loadComponents();
                })
                //execute post render
                .then(function() {
                    return _this.execute(_this.postRender);
                })
                // After loading components, render them
                .then(function() {
                    //TODO: Chance of refactoring
                    //Every widget binds its resize function to the resize event
                    return _this.renderComponents();
                })
                // After rendering the components, resolve the defer
                .done(function() {
                    //not loading anytmore, remove class
                    if (_this.element) {
                        _this.element.classed(class_loading, false);
                    }
                    _this.update();
                    _this._ready = true; //everything is ready
                    _this.trigger('ready');
                    defer.resolve();
                });

            return defer;
        },

        /**
         * Execute function with promise support
         * @param {Function} function any function
         * @returns defer a promise to be resolved when function is resolved
         */
        //todo: check if this is actually necessary here
        execute: function(func) {
            var defer = $.Deferred(),
                possiblePromise;

            // only try to execute if it is a function
            if (_.isFunction(func)) {
                possiblePromise = func.apply(this);
            };

            // if a promise is returned, solve it when its done
            if (possiblePromise && _.isFunction(possiblePromise.then)) {
                possiblePromise.done(function() {
                    defer.resolve();
                });
            }
            // if no promise is returned, resolve right away
            else {
                return true;
            }

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
            this.components = {};

            // Loops through components, loading them.
            _.each(components, function(component) {
                var promise = _this.loadComponent(component);
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
                component_path = "components/" + path + "/" + name,
                component_model;

            //component model mapping
            component_model = this._modelMapping(component.model);

            //component options
            var config = _.extend(component, {
                name: name,
                model: component_model
            });

            // Loads the file we need
            require([component_path], function(subcomponent) {
                //initialize subcomponent
                _this.components[id] = new subcomponent(config, _this);
                defer.resolve();
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
                    _this.placeholder = (_.isString(_this.placeholder)) ? root.select(_this.placeholder) : _this.placeholder;
                    _this.placeholder.html(rendered);

                    //TODO: refactor the way we select the first child
                    //define this element inside the placeholder
                    try {
                        _this.element = utils.jQueryToD3(
                            utils.d3ToJquery(_this.placeholder).children().first()
                        );
                    } catch (err) {
                        console.error("Placeholder div not found! Check the name of the placeholder for the component " + this.template);
                        console.error(err);
                    }

                    //Resolve defer
                    defer.resolve();
                });

            } else {
                defer.resolve();
            }

            return defer;
        },

        //TODO: remove this method - It's just wrapping an already
        //existing model method
        setState: function(state) {
            this.model.setState(state);
        },

        /**
         * Interface for postRender
         */
        postRender: function() {},

        /**
         * Update calls update for all sub-components
         */
        update: function() {
            if (this._blockUpdate) return;
            var _this = this;
            this._update = this._update || _.throttle(function() {
                for (var i in _this.components) {
                    if (_this.components.hasOwnProperty(i)) {
                        _this.components[i].update();
                    }
                }
            }, this._frameRate);
            this._update();
        },

        /**
         * Resize calls resize for all sub-components
         */
        resize: function() {
            if (this._blockResize) return;
            var _this = this;
            this._resize = this._resize || _.throttle(function() {
                for (var i in _this.components) {
                    if (_this.components.hasOwnProperty(i)) {
                        _this.components[i].resize();
                    }
                }
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
        reassignModel: function() {
            //only reassign if it's loaded already
            if (_.isArray(this.components)) return;

            var _this = this;
            //for each subcomponent, reassign model
            for (var i in this._components_config) {
                var c = this._components_config[i],
                    id = c.placeholder, //placeholder is used as id
                    model = this._modelMapping(c.model);

                if (model) {
                    this.components[id].model = model;
                    this.components[id].reassignModel();
                }
            }
        },

        /**
         * Maps the current model to the subcomponents
         * @param {String|Array} model_config Configuration of model
         * @returns {Object} the model
         */
        //todo: make it more readable
        _modelMapping: function(model_config) {

            var _this = this;

            function _mapOne(name) {
                var parts = name.split("."),
                    current = _this.model,
                    current_name = "";
                while (parts.length) {
                    current_name = parts.shift();
                    current = current.get(current_name);
                }
                return {
                    name: current_name,
                    model: current
                };
            }
            if (_.isUndefined(model_config)) {
                return;
            }
            if (_.isArray(model_config) && model_config.length > 1) {
                var values = {};
                for (var i = 0, size = model_config.length; i < size; i++) {
                    var model_info = _mapOne(model_config[i]);
                    values[model_info.name] = model_info.model;
                }
                return values;
            } else if (_.isArray(model_config) && model_config.length == 1) {
                return _mapOne(model_config[0]).model;
            } else if (_.isString(model_config) && model_config.length > 0) {
                return _mapOne(model_config).model;
            } else {
                return new Model({});
            }

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
        //todo: improve translation of strings
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
            this._events.bind(name, func);
        },

        /**
         * Triggers an event from this model
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        trigger: function(name, val) {
            this._events.trigger(name, val);
        },

        /**
         * Triggers an event from this model and all parent events
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        triggerAll: function(name, val) {
            this._events.triggerAll(name, val);
        }

    });


    return Component;
});