/*!
 * VIZABI COMPONENT
 * Base Component
 */

(function() {

    "use strict";

    var class_loading = "vzb-loading";
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var templates = {};
    var componentsList = {};

    var Component = Vizabi.Events.extend({

        /**
         * Initializes the component
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} parent Reference to tool
         */
        init: function(config, parent) {

            this._id = this._id || utils.uniqueId("c");
            this._ready = false;
            this._readyOnce = false;

            this.name = this.name || config.name;
            this.template = this.template || config.template;
            this.placeholder = this.placeholder || config.placeholder;
            this.template_data = this.template_data || {
                name: this.name
            };

            //make sure placeholder is DOM element
            if (this.placeholder && !utils.isElement(this.placeholder)) {
                try {
                    this.placeholder = parent.placeholder.querySelector(this.placeholder);
                } catch (e) {
                    utils.error("Error finding placeholder '" + this.placeholder + "' for component '" + this.name + "'");
                }
            }

            this._parent = parent;
            this.components = this.components || [];
            this._components_config = this.components.map(function(x) {
                return utils.clone(x);
            });
            this._frameRate = 10;

            //define expected models for this component
            this.model_expects = this.model_expects || [];
            this.model_binds = this.model_binds || {};

            this.ui = this.ui || config.ui;

            this._super();

        },

        /**
         * Renders the component (after data is ready)
         */
        render: function() {
            this.loadTemplate();
            this.loadComponents();

            // if (_this.isRoot()) {
            //     _this.model.setHooks();
            //     return _this.model.load();
            // }

            // //then

            // if (_this.isRoot()) {
            //     return _this.model.validate();
            // }

            // //then

            // _this.trigger('dom_ready');
            // console.timeStamp("Vizabi Component: DOM ready - " + _this.name);

            // //ready when model is also ready
            // _this.model.on("ready", function() {
            //     //TODO: delay is a hotfix to visually avoid flickering
            //     //TODO: Guarantee the model is ready (hotfix - remove)
            //     if (_this.model._ready) {
            //         _.defer(function() {
            //             _this.placeholder.classed(class_loading, false);

            //             if (!_this._readyOnce) {
            //                 _this.trigger('ready', _this.model.getObject());
            //                 _this._readyOnce = true;
            //             }
            //         });
            //     }


        },

        /**
         * Loads the template
         * @returns defer a promise to be resolved when template is loaded
         */
        loadTemplate: function() {
            var tmpl = this.template;
            var data = this.template_data;
            var _this = this;
            var rendered = "";

            if (!this.placeholder) {
                return;
            }

            if (this.template) {
                try {
                    rendered = templateFunc(tmpl, data);
                } catch (e) {
                    utils.error("Templating error for component: '" + this.name + "'");
                }
            }
            //add loading class and html
            utils.addClass(this.placeholder, class_loading);
            this.placeholder.innerHTML = rendered;
            this.element = this.placeholder.children[0];

            //only tools have layout (manage sizes)
            if (this.layout) {
                this.layout.setContainer(this.placeholder);
                this.layout.on('resize', function() {
                    _this.trigger('resize');
                });
            }
        },

        /*
         * Loads all subcomponents
         */
        loadComponents: function() {
            var _this = this;
            var config;
            //use the same name for collection
            this.components = [];

            // Loops through components, loading them.
            utils.forEach(this._components_config, function(c) {

                if (!c.component) {
                    utils.error("Error loading component: name not provided");
                    return;
                }
                if(!componentsList.hasOwnProperty(c.component)) {
                    utils.error("Component not registered: "+c.component);
                    return;
                }

                config = utils.extend(c, {
                    name: c.component,
                    ui: _this._uiMapping(c.placeholder, c.ui)
                });

                //instantiate new subcomponent
                var subcomp = new componentsList[c.component](config, _this);
                var c_model = c.model || [];
                // subcomp.model = _this._modelMapping(subcomp.name, c_model, subcomp.model_expects, subcomp.model_binds);

                subcomp.render();
                _this.components.push(subcomp);
            });
        },

        //TODO: make ui mapping more powerful
        /**
         * Maps the current ui to the subcomponents
         * @param {String} id subcomponent id (placeholder)
         * @param {Object} ui Optional ui parameters to overwrite existing
         * @returns {Object} the UI object
         */
        _uiMapping: function(id, ui) {

            //if overwritting UI
            if (ui) {
                return new Vizabi.Model(ui);
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


    });

    // Based on Simple JavaScript Templating by John Resig
    //generic templating function
    function templateFunc(str, data) {
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
            templates[str] = templates[str] ||
            templateFunc(root.document.getElementById(str).innerHTML) :
            // Generate a reusable function that will serve as a template
            // generator (and which will be cached).
            new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +
                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +
                // Convert the template into pure JavaScript
                str
                .replace(/[\r\t\n]/g, " ")
                .split("<%").join("\t")
                .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                .replace(/\t=(.*?)%>/g, "',$1,'")
                .split("\t").join("');")
                .split("%>").join("p.push('")
                .split("\r").join("\\'") + "');}return p.join('');");
        // Provide some basic currying to the user
        return data ? fn(data) : fn;
    }

    Vizabi.Component = Component;

    //stores each registered component
    Vizabi._components = componentsList;

    //TODO: automatically register on extend
    //Example: Vizabi.Component.extend(<name>, <methods>);

    /*
     * registers a new component to Vizabi
     * @param {String} component_name
     * @param {Object} code
     */
    Vizabi.registerComponent = function(component_name, code) {
        if (typeof componentsList[component_name] !== 'undefined') {
            utils.warn(component_name + ' already registered. Overwriting');
        }
        componentsList[component_name] = code;
    };

    /*
     * unregisters a component from Vizabi
     */
    Vizabi.unregisterComponent = function(component_name) {
        delete componentsList[component_name];
    };

}).call(this);




// define([
//     'q',
//     'd3',
//     'lodash',
//     'base/utils',
//     'base/class',
//     'base/model',
//     'base/events'
// ], function(Q, d3, _, utils, Class, Model, Events) {

//     var Component = Class.extend({

//         /**
//          * Initializes the component
//          * @param {Object} config Initial config, with name and placeholder
//          * @param {Object} parent Reference to tool
//          */
//         init: function(config, parent) {

//             this._id = this._id || _.uniqueId("c");
//             this._rendered = false;
//             this._ready = false;
//             this._readyOnce = false;
//             this._debugEvents = this._debugEvents || false;

//             this.intervals = this.intervals;
//             this.components = this.components || [];
//             this.parent = parent;

//             this._events = new Events();
//             this._components_config = this.components;
//             this._frameRate = 10;

//             //define expected models for this component
//             this.model_expects = this.model_expects || [];
//             this.model_binds = this.model_binds || {};

//             this.ui = this.ui || config.ui;

//             //set placeholder as d3 entity already
//             if (_.isString(this.placeholder) || _.isElement(this.placeholder)) {
//                 this.placeholder = d3.select(this.placeholder);
//             } else {
//                 console.error('ERROR: the placeholder argument should be a selector or DOM element');
//             }

//             var _this = this;
//             this.on({
//                 'dom_ready': function() {
//                     _this.domReady();

//                     //TODO: hotfix for non-data viz
//                     _.defer(function() {
//                         if (_this.model._ready && !_this._readyOnce) {
//                             _this.trigger('ready', _this.model.getObject());
//                             _this._readyOnce = true;
//                             // _this.modelReady('dom_ready');
//                         }
//                     });
//                 },
//                 'resize': function() {
//                     if (_this._ready) {
//                         _this.resize();
//                     }
//                 }
//             });
//         },

//         /**
//          * Renders the component, step by step - Assumes data is ready
//          * @returns defer a promise to be resolved when component is rendered
//          */
//         render: function() {

//             if (this._ready) return; //a component only renders once

//             var defer = Q.defer();
//             var _this = this;

//             // First, we load the template
//             var promise = this.loadTemplate();

//             // After the template is loaded, its loading data
//             promise.then(function() {

//                     console.timeStamp("Vizabi Component: Template loaded - " + _this.name);

//                     // attempt to setup layout
//                     if (_this.layout) {
//                         _this.layout.setContainer(_this.element);
//                         _this.layout.resize();
//                         _this.layout.on('resize', function() {
//                             _this.trigger('resize');
//                         });
//                     }

//                     // add css loading class to hide elements
//                     _this.placeholder.classed(class_loading, true);

//                     _this._rendered = true; //template is in place
//                 })
//                 // After load components
//                 .then(function() {
//                     return _this.loadComponents();
//                 })
//                 // After loading components, render them
//                 .then(function() {
//                     return _this.renderComponents();
//                 })
//                 // After rendering the components, resolve the defer
//                 .then(function() {

//                     _this._ready = true;

//                     if (_this.isRoot()) {
//                         _this.model.setHooks();
//                         return _this.model.load();
//                     }


//                 }).then(function() {
//                     if (_this.isRoot()) {
//                         return _this.model.validate();
//                     }
//                 }).then(function() {

//                     _this.trigger('dom_ready');
//                     console.timeStamp("Vizabi Component: DOM ready - " + _this.name);

//                     //ready when model is also ready
//                     _this.model.on("ready", function() {
//                         //TODO: delay is a hotfix to visually avoid flickering
//                         //TODO: Guarantee the model is ready (hotfix - remove)
//                         if (_this.model._ready) {
//                             _.defer(function() {
//                                 _this.placeholder.classed(class_loading, false);

//                                 if (!_this._readyOnce) {
//                                     _this.trigger('ready', _this.model.getObject());
//                                     _this._readyOnce = true;
//                                 }
//                             });
//                         }
//                     });
//                 }).then(function() {
//                     defer.resolve();
//                 });

//             return defer.promise;
//         },

//         /**
//          * Loads all subcomponents
//          * @returns defer a promise to be resolved when components are loaded
//          */
//         loadComponents: function() {
//             var _this = this,
//                 promises = [],
//                 components = this.components;

//             //save initial config
//             this._components_config = _.map(components, _.clone);
//             //use the same name for the initialized collection           
//             this.components = [];

//             // Loops through components, loading them.
//             _.each(components, function(component) {
//                 var promise = _this.loadComponent(component)
//                     .then(function(loaded_comp) {
//                         _this.components.push(loaded_comp);
//                     });
//                 promises.push(promise);
//             });

//             // When all components have been loaded, resolve the defer
//             return Q.all(promises);
//         },

// //         /**
// //          * Load component
// //          * @param {Object} component the configuration for a component
// //          * @returns defer a promise to be resolved when the component is loaded
// //          */
//         loadComponent: function(component) {

//             if (!component.component || !component.placeholder) {
//                 console.log("Error loading component");
//                 return true;
//             }

//             //name and path
//             var _this = this,
//                 defer = Q.defer(),
//                 path = component.component,
//                 name_token = path.split("/"),
//                 name = name_token[name_token.length - 1],
//                 id = component.placeholder,
//                 comp_path = "components/" + path + "/" + name,
//                 comp_model = component.model || [],
//                 comp_ui = this._uiMapping(id, component.ui);

//             //component options
//             var config = _.extend(component, {
//                 name: name,
//                 ui: comp_ui
//             });

//             // Loads the file we need
//             require([comp_path], function(subcomponent) {
//                 //initialize subcomponent
//                 var c = new subcomponent(config, _this);
//                 //setup model later with expected models
//                 c.model = _this._modelMapping(c.name,
//                     comp_model,
//                     c.model_expects,
//                     c.model_binds,
//                     function() {
//                         defer.resolve(c);
//                     });
//             });

//             return defer.promise;
//         },

//         /**
//          * Renders subcomponents
//          * @returns defer a promise to be resolved when components are rendered
//          */
//         renderComponents: function() {
//             var promises = [];

//             // Loops through components, rendering them.
//             _.each(this.components, function(component) {
//                 promises.push(component.render());
//             });

//             return Q.all(promises);
//         },

//         /**
//          * Loads the template
//          * @returns defer a promise to be resolved when template is loaded
//          */
//         loadTemplate: function() {
//             var _this = this;
//             var defer = Q.defer();

//             //todo: improve t function getter + generalize this
//             this.template_data = _.extend(this.template_data, {
//                 t: this.getTranslationFunction(true)
//             });


//             if (this.template) {
//                 //require the template file
//                 require(["text!" + this.template + ".html"], function(html) {
//                     //render template using lodash
//                     var rendered = _.template(html, _this.template_data);

//                     var root = _this.parent.element || d3;
//                     //place the contents into the correct placeholder
//                     _this.placeholder = (_.isString(_this.selector) || _.isElement(_this.selector)) ? root.select(_this.selector) : _this.placeholder;

//                     //add placeholder identifiers
//                     _this.placeholder.attr("data-component", "true");
//                     _this.placeholder.html(rendered);

//                     try {
//                         var element = _this.placeholder.node().children[0];
//                         _this.element = d3.select(element);

//                         if (!_this.element.node()) {
//                             console.warn("Component element not found (root HTML node in the component's markup). Verify that " + this.template + "contains valid HTML/template.");
//                         }
//                     } catch (err) {
//                         console.warn("Placeholder div not found! Check the name of the placeholder for the component " + _this.template);
//                     }

//                     defer.resolve();
//                 });

//             } else {
//                 defer.resolve();
//             }

//             return defer.promise;
//         },

//         /**
//          * Interface for domReady
//          * To be called whenever the template is finally ready
//          */
//         domReady: function() {},

//         /**
//          * modelReady calls modelReady for all sub-components
//          */
//         // modelReady: function(evt) {

//         //     //TODO: this entire function needs to be removed
//         //     //our approach is focused more on descentralized rendering
//         //     //blocking update should be from the events level
//         //     if (this._blockUpdate) return;
//         //     var _this = this;
//         //     this._modelReady = this._modelReady || _.throttle(function() {
//         //         _.each(_this.components, function(component) {
//         //             component.modelReady(evt);
//         //         });
//         //     }, this._frameRate);
//         //     this._modelReady();
//         // },

//         /**
//          * Resize calls resize for all sub-components
//          */
//         resize: function() {
//             if (this._blockResize) return;
//             var _this = this;
//             this._resize = this._resize || _.throttle(function() {
//                 _.each(_this.components, function(component) {
//                     component.trigger('resize');
//                 });
//             }, this._frameRate);
//             this._resize();
//         },

//         /**
//          * Blocks execution of update method
//          * @param {Boolean} val
//          */
//         blockUpdate: function(val) {
//             if (typeof val === 'undefined') val = true;
//             this._blockUpdate = val;
//         },

//         /**
//          * Blocks execution of resize method
//          * @param {Boolean} val
//          */
//         blockResize: function(val) {
//             if (typeof val === 'undefined') val = true;
//             this._blockResize = val;
//         },

//         /**
//          * Destroys component
//          */
//         destroy: function() {
//             if (this.model) this.model.clear();
//             if (this.layout) this.layout.destroy();
//             if (this.intervals) this.intervals.clearAllIntervals();
//             if (this._events) this._events.unbindAll();
//             if (this.components) this.components = [];
//             if (this.placeholder) this.placeholder.html('');
//         },

//         /**
//          * Reassigns all models (on overwrite
//          */
//         //TODO: After changes in _modelMapping, this won't work. Fix it!
//         reassignModel: function() {
//             //only reassign if it's already initialized
//             if (!this._ready) return;

//             var _this = this;
//             //for each subcomponent configuration, reassign model
//             _.each(this._components_config, function(c, i) {
//                 var model = _this._modelMapping(c.name, c.model);
//                 if (model) {
//                     _this.components[i].model = model;
//                     _this.components[i].reassignModel();
//                 }
//             });
//         },

//         /**
//          * Maps the current model to the subcomponents
//          * @param {String} subcomponent name of the subcomponent
//          * @param {String|Array} model_config Configuration of model
//          * @param {String|Array} model_expects Expected models
//          * @param {Object} model_binds Initial model bindings
//          * @returns {Object} the model
//          */
//         _modelMapping: function(subcomponent, model_config, model_expects, model_binds, ready) {

//             var _this = this,
//                 values = {};

//             //If model_config is an array, we map it
//             if (_.isArray(model_config)) {

//                 //if there's a different number of models received and expected
//                 if (model_expects.length !== model_config.length) {
//                     console.groupCollapsed("DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED");
//                     console.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + this.name + "'\nSubcomponent: '" + subcomponent + "'\nNumber of Models Expected: " + model_expects.length + "\nNumber of Models Received: " + model_config.length);
//                     console.groupEnd();

//                 }

//                 //map current submodels to new model
//                 for (var i = 0, s = model_config.length; i < s; i++) {
//                     //get current model and rename if necessary
//                     var model_info = _mapOne(model_config[i]),
//                         new_name;

//                     if (model_expects[i]) {

//                         new_name = model_expects[i].name;

//                         if (model_expects[i].type && model_info.type !== model_expects[i].type) {

//                             //TODO: add link to the documentation about model_expects
//                             console.groupCollapsed("UNEXPECTED MODEL TYPE: '" + model_info.type + "' instead of '" + model_expects[i].type + "'");
//                             console.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + this.name + "'\nSubcomponent: '" + subcomponent + "'\nExpected Model: '" + model_expects[i].type + "'\nReceived Model'" + model_info.type + "'\nModel order: " + i);
//                             console.groupEnd();
//                         }

//                     } else {
//                         //TODO: add link to the documentation about model_expects
//                         console.groupCollapsed("UNEXPECTED MODEL: '" + model_config[i] + "'");
//                         console.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + this.name + "'\nSubcomponent: '" + subcomponent + "'\nNumber of Models Expected: " + model_expects.length + "\nNumber of Models Received: " + model_config.length);
//                         console.groupEnd();

//                         new_name = model_info.name;
//                     }

//                     values[new_name] = model_info.model;
//                 }

//                 //check for remaining expected models
//                 var existing = model_config.length,
//                     expected = model_expects.length;
//                 if (expected > existing) {
//                     //skip existing
//                     model_expects.splice(0, existing);
//                     //adds new expected models if needed
//                     for (var k = 0; k < expected; k++) {
//                         //force new empty model
//                         values[model_expects[k].name] = {};
//                     }
//                 }
//             }

//             //return a new model with the defined submodels
//             var model = new Model(values, this.intervals, {
//                 //bind callback after model is all set
//                 'set': function() {
//                     afterSet();
//                     if (_.isFunction(ready)) {
//                         ready();
//                     }
//                 }
//             });

//             //binds init bindings to this model
//             if (_.isPlainObject(model_binds)) {
//                 model.on(model_binds);
//             }

//             return model;

//             function afterSet() {
//                 var submodels = model.getSubmodels();
//                 //binding submodels
//                 for (var submodel in model.get()) {

//                     if (_.isUndefined(model[submodel]._id)) continue;

//                     //closure to set up the submodel
//                     (function(model, submodel) {

//                         model[submodel].on({
//                             //the submodel has been set (only once)
//                             'set': function(evt, vals) {
//                                 //trigger only for submodel
//                                 evt = evt.replace('set', 'set:' + submodel);
//                                 model.trigger(evt, vals);

//                                 //if all are ready, trigger for this model
//                                 if (_.every(submodels, function(sm) {
//                                         return sm._set;
//                                     })) {
//                                     model.triggerOnce('set', vals);
//                                 }
//                             },
//                             //the submodel has initialized (only once)
//                             'init': function(evt, vals) {
//                                 evt = evt.replace('init', 'init:' + submodel);
//                                 model.triggerAll(evt, model.getObject());
//                             },
//                             //the submodel has changed (multiple times)
//                             'change': function(evt, vals) {
//                                 evt = evt.replace('change', 'change:' + submodel);
//                                 model.triggerAll(evt, model.getObject());
//                             },
//                             //loading has started in this submodel (multiple times)
//                             'load_start': function(evt, vals) {
//                                 evt = evt.replace('load_start', 'load_start:' + submodel);
//                                 model.triggerAll(evt, vals);
//                             },
//                             //loading has failed in this submodel (multiple times)
//                             'load_error': function(evt, vals) {
//                                 evt = evt.replace('load_error', 'load_error:' + submodel);
//                                 model.triggerAll(evt, vals);
//                             },
//                             //the submodel is ready/loading has ended
//                             'ready': function(evt, vals) {
//                                 //trigger only for submodel
//                                 evt = evt.replace('ready', 'ready:' + submodel);
//                                 model.trigger(evt, vals);

//                                 model.setReady();
//                             }
//                         });

//                     })(model, submodel); //self executing function

//                 }
//             }

//             /**
//              * Maps one model name to current submodel and returns info
//              * @param {String} name Full model path. E.g.: "state.marker.color"
//              * @returns {Object} the model info, with name and the actual model
//              */
//             function _mapOne(name) {
//                 var parts = name.split("."),
//                     current = _this.model,
//                     current_name = "";
//                 while (parts.length) {
//                     current_name = parts.shift();
//                     current = current[current_name];
//                 }
//                 return {
//                     name: name,
//                     model: current,
//                     type: current.getType()
//                 };
//             }

//         },

//         /**
//          * Maps the current ui to the subcomponents
//          * @param {String} id subcomponent id (placeholder)
//          * @param {Object} ui Optional ui parameters to overwrite existing
//          * @returns {Object} the UI object
//          */
//         //todo: make it more powerful
//         _uiMapping: function(id, ui) {

//             //if overwritting UI
//             if (ui) {
//                 return new Model(ui);
//             }

//             if (id && this.ui) {
//                 id = id.replace(".", ""); //remove trailing period
//                 var sub_ui = this.ui[id];
//                 if (sub_ui) {
//                     return sub_ui;
//                 }
//             }
//             return this.ui;
//         },

//         /**
//          * Get layout profile of the current resolution
//          * @returns {String} profile
//          */
//         getLayoutProfile: function() {
//             //get profile from parent if layout is not available
//             if (this.layout) {
//                 return this.layout.currentProfile();
//             } else {
//                 return this.parent.getLayoutProfile();
//             }
//         },

//         /**
//          * Get translation function for templates
//          * @param {Boolean} wrap wrap in spam tags
//          * @returns {Function}
//          */
//         getTranslationFunction: function(wrap) {
//             var t_func;
//             try {
//                 t_func = this.model.get("language").getTFunction();
//             } catch (err) {
//                 if (this.parent && this.parent != this) {
//                     t_func = this.parent.getTranslationFunction();
//                 }
//             }

//             if (!t_func) {
//                 t_func = function(s) {
//                     return s;
//                 };
//             }
//             if (wrap) return this._translatedStringFunction(t_func);
//             else return t_func;
//         },

//         /**
//          * Get function for translated string
//          * @param {Function} translation_function The translation function
//          * @returns {Function}
//          */
//         _translatedStringFunction: function(translation_function) {
//             return function(string) {
//                 var translated = translation_function(string);
//                 return '<span data-vzb-translate="' + string + '">' + translated + '</span>';
//             };
//         },

//         /**
//          * Translate all strings in the template
//          */
//         translateStrings: function() {
//             var t = this.getTranslationFunction();
//             var strings = this.placeholder.selectAll('[data-vzb-translate]');
//             for (var i = 0; i < strings[0].length; i++) {
//                 var string = strings[0][i];
//                 var original = string.getAttribute("data-vzb-translate");
//                 string.innerHTML = t(original);
//             }
//         },

//         /**
//          * Loads data
//          * @returns true assume it's loaded
//          */
//         loadData: function() {
//             return true;
//         },

//         /**
//          * Checks whether this component is a tool or not
//          * @returns {Boolean}
//          */
//         isTool: function() {
//             return this._id[0] === 't';
//         },

//         /**
//          * Checks whether this component is a root element
//          * (not included by another)
//          * @returns {Boolean}
//          */
//         isRoot: function() {
//             return this.parent === this;
//         },

//         /*
//          * Event binding methods
//          */

//         /**
//          * Binds function to an event in this model
//          * @param {String} name name of event
//          * @param {Function} func function to be executed
//          */
//         on: function(name, func) {

//             if (this._debugEvents && this._debugEvents !== "trigger") {
//                 var i;
//                 if (_.isPlainObject(name)) {
//                     for (i in name) {
//                         console.log("Component", this.name, "> bind:", i);
//                     }
//                 } else if (_.isArray(name)) {
//                     for (i in name) {
//                         console.log("Component", this.name, "> bind:", name[i]);
//                     }
//                 } else {
//                     console.log("Component", this.name, "> bind:", name);
//                 }
//             }

//             this._events.bind(name, func);
//         },

//         /**
//          * Triggers an event from this model
//          * @param {String} name name of event
//          * @param val Optional values to be sent to callback function
//          */
//         trigger: function(name, val) {

//             if (this._debugEvents && this._debugEvents !== "bind") {
//                 console.log("============================================");
//                 if (_.isArray(name)) {
//                     for (var i in name) {
//                         console.log("Component", this.name, "> triggered:", name[i]);
//                     }
//                 } else {
//                     console.log("Component", this.name, "> triggered:", name);
//                 }
//                 console.log('\n');
//                 console.info(utils.formatStacktrace(utils.stacktrace()));
//                 console.log("____________________________________________");
//             }

//             this._events.trigger(this, name, val);
//         },

//         /**
//          * Triggers an event from this model and all parent events
//          * @param {String} name name of event
//          * @param val Optional values to be sent to callback function
//          */
//         triggerAll: function(name, val) {

//             if (this._debugEvents && this._debugEvents !== "bind") {
//                 console.log("============================================");
//                 if (_.isArray(name)) {
//                     for (var i in name) {
//                         console.log("Component", this.name, "> triggered all:", name[i]);
//                     }
//                 } else {
//                     console.log("Component", this.name, "> triggered all:", name);
//                 }
//                 console.log('\n');
//                 console.info(utils.formatStacktrace(utils.stacktrace()));
//                 console.log("____________________________________________");
//             }

//             this._events.triggerAll(this, name, val);
//         }

//     });


//     return Component;
// });