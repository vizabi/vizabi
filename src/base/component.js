define([
    'jquery',
    'd3',
    'underscore',
    'base/utils',
    'base/class',
    'base/model',
    'base/events'
], function($, d3, _, utils, Class, Model, Events) {

    var Component = Class.extend({
        init: function(parent, options) {
            this.name = this.name || options.name;
            this.state = this.state || options.state;
            this.placeholder = this.placeholder || options.placeholder;
            this.data = this.data || options.data;

            this.model = this.model || options.model;
            this.element = this.element || null;
            this.template = this.template || null;
            this.template_data = this.template_data || {
                name: this.name
            };
            // Markup to define where a Component is going to be rendered.
            // Element which embodies the Component
            this.element = this.element || null;
            this.components = this.components || [];

            this.profiles = this.profiles || {};
            this.parent = parent;

            this.events = Events;
        },

        //TODO: change the scary name! :D bootstrap is one good one
        render: function(callback) {
            var defer = $.Deferred();
            var _this = this;

            // First, we load the template
            var promise = this.loadTemplate();

            // After the template is loaded, check if postRender exists
            promise.then(function() {

                // add css loading class to hide elements
                _this.element.classed("loading", true);

                // attempt to execute postRender
                if (typeof callback === 'function') {
                    return callback();
                }

            })
            // If there is no callback
            .then(function() {
                return _this.execute(_this.postRender);
            })
            // After postRender, resize and load components
            .then(function() {

                //TODO: Chance of refactoring
                //Every widget binds its resize function to the resize event
                _this.resize();
                _this.events.bind('resize', function() {
                    _this.resize();
                });

                return _this.loadComponents();
            })
            // After loading components, render them
            .then(function() {
                return _this.renderComponents();
            })
            // After rendering the components, resolve the defer
            .done(function() {
                //not loading anytmore, remove class
                _this.element.classed("loading", false);

                defer.resolve();
            });

            return defer;
        },

        // Execute function if it exists, with promise support
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
                defer.resolve();
            }

            return defer;
        },

        loadComponents: function() {
            var defer = $.Deferred(),
                _this = this,
                promises = [],
                components = this.components;

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

        loadComponent: function(component) {
            var _this = this,
                defer = $.Deferred(),
                name = component.name,
                id = _.uniqueId(name),
                path = "components/" + name + "/" + name,
                component_model = this.model;

            //component model mapping
            if (component.model) {
                if (_.isFunction(component.model)) {
                    component_model = new Model(component.model());
                } else {
                    component_model = new Model(component.model);
                }
            } else if (this.getModelMapping(name)) {
                component_model = new Model(this.getModelMapping(name));
            }

            //component options
            var options = _.extend(component.options, {
                name: name,
                model: component_model
            });

            // Loads the file we need
            require([path], function(subcomponent) {
                //initialize subcomponent
                _this.components[id] = new subcomponent(_this, options);
                defer.resolve();
            });

            return defer;
        },

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

        loadTemplate: function() {
            var _this = this;
            var defer = $.Deferred();

            this.template_data = _.extend(this.template_data, { t: this.getTFunction() })

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

            return defer;
        },

        //TODO: remove this method - It's just wrapping an already
        //existing model method
        setState: function(state) {
            this.model.setState(state);
        },

        // Component-level update updates the sub-components
        update: function() {
            for (var i in this.components) {
                if (this.components.hasOwnProperty(i)) {
                    this.components[i].update();
                }
            }
        },

        resize: function() {
            //what to do when page is resized
        },

        postRender: function() {

        },

        getModelMapping: function(component) {
            return this.modelMapping()[component];
        },

        //maps the current model to subcomponents
        modelMapping: function() {
            return {};
        },

        getInstance: function(manager) {
            return this.parent.getInstance(manager);
        },

        getLayoutProfile: function() {
            if (this.layout) {
                return this.layout.currentProfile();
            } else {
                return this.parent.getLayoutProfile();
            }
        },

        addComponent: function(name, options) {
            if (_.isUndefined(this.components)) this.components = [];
            this.components.push({
                name: name,
                options: options
            });
        },

        getUIString: function(string) {
            var lang = this.model.get("language");
            var ui_strings = this.model.get("ui_strings");

            if (ui_strings && ui_strings.hasOwnProperty(lang) && ui_strings[lang].hasOwnProperty(string)) {
                return ui_strings[lang][string];
            } else {
                return string;
            }
        },

        getTFunction: function() {
            var lang = this.model.get("language");
            var ui_strings = this.model.get("ui_strings");

            return function(string) {
                console.log(ui_strings);
                if (ui_strings && ui_strings.hasOwnProperty(lang) && ui_strings[lang].hasOwnProperty(string)) {
                    return ui_strings[lang][string];
                } else {
                    return string;
                }
            }
        }

    });


    return Component;
});