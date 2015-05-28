/*!
 * VIZABI COMPONENT
 * Base Component
 */

(function() {

    "use strict";

    var class_loading = "vzb-loading";
    var class_loading_data = "vzb-loading";
    var class_loading_error = "vzb-loading-error";
    var class_placeholder = "vzb-placeholder";
    var class_buttons_off = "vzb-buttonlist-off";
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var templates = {};
    var toolsList = {};

    //tool model is quite simple and doesn't need to be registered
    var ToolModel = Vizabi.Model.extend({
        /**
         * Initializes the tool model.
         * @param {Object} values The initial values of this model
         * @param {Object} binds contains initial bindings for the model
         * @param {Function|Array} validade validate rules
         */
        init: function(values, defaults, binds, validate) {
            this._id = utils.uniqueId("tm");
            this._type = "tool";

            //generate validation function
            this.validate = generateValidate(this, validate);

            //default submodels
            values = values || {};
            defaults = defaults || {};
            values = defaultOptions(values, defaults);

            //constructor is similar to model
            this._super(values, null, binds, true);

            // change language
            if (values.language) {
                var _this = this;
                this.on("change:language", function() {
                    _this.trigger("translate");
                });
            }
        }
    });

    //tool
    var Tool = Vizabi.Component.extend({

        /**
         * Initializes the tool
         * @param {Object} placeholder object
         * @param {Object} options Options such as state, data, etc
         */
        init: function(placeholder, options) {

            this._id = utils.uniqueId("t");
            this.layout = new Vizabi.Layout();
            this.template = this.template || '<div class="vzb-tool vzb-tool-'+this.name+'"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div></div></div>';

            this.model_binds = this.model_binds || {};
            this.default_options = this.default_options || {};

            //bind the validation function with the tool
            var validate = this.validate.bind(this);

            var _this = this;
            var callbacks = utils.merge({
                'change': function(evt, val) {
                    if (_this._ready) {
                        _this.model.validate();
                        _this.triggerAll(evt, val);
                    }
                },
                'translate': function(evt, val) {
                    if (_this._ready) {
                        _this.model.load().then(function() {
                            _this.model.validate();
                            _this.translateStrings();
                        });
                    }
                },
                'load_start': function() {
                    _this.beforeLoading();
                },
                'load_error': function() {
                    _this.errorLoading();
                },
                'ready': function(evt) {
                    if (_this._ready) {
                        _this.afterLoading();
                    }
                }
            }, this.model_binds);

            options = options || {};
            this.model = new ToolModel(options, this.default_options, callbacks, validate);
            //ToolModel starts in frozen state. unfreeze;
            this.model.unfreeze();

            this.ui = this.model.ui;

            this._super({
                name: this.name || this._id,
                placeholder: placeholder
            }, this);

            this._bindEvents();
            this.render();
            this._setUIOptions();
        },

        /**
         * Binds events in model to outside world
         */
        _bindEvents: function() {
            if (!this.model.bind) return;
            this.on(this.model.bind.get());
        },

        /**
         * Sets options from external page
         * @param {Object} options new options
         * @param {Boolean} overwrite overwrite everything instead of extending
         * @param {Boolean} silent prevent events
         */
        setOptions: function(options, overwrite, silent) {
            if (overwrite) {
                this.model.reset(options);
            } else {
                this.model.set(options);
            }
            this._setUIOptions();
        },

        /**
         * gets all options
         * @param {Object} options new options
         * @param {Boolean} overwrite overwrite everything instead of extending
         * @param {Boolean} silent prevent events
         */
        getOptions: function() {
            return this.model.getObject() || {};
        },

        /**
         * Displays loading class
         */
        beforeLoading: function() {
            if (!utils.hasClass(this.placeholder, class_loading_data)) {
                utils.addClass(this.placeholder, class_loading_data);
            }
        },

        /**
         * Removes loading class
         */
        afterLoading: function() {
            utils.removeClass(this.placeholder, class_loading_data);
        },

        /**
         * Adds loading error class
         */
        errorLoading: function() {
            utils.addClass(this.placeholder, class_loading_error);
        },

        /* ==========================
         * Validation and query
         * ==========================
         */

        /**
         * Placeholder for model validation
         */
        validate: function() {
            //placeholder for tool validation methods
        },

        _setUIOptions: function() {
            //add placeholder class
            utils.addClass(this.placeholder, class_placeholder);

            //add-remove buttonlist class
            if(!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
                utils.addClass(this.element, class_buttons_off);
            } else {
                utils.removeClass(this.element, class_buttons_off);
            }
        }


    });

    /* ==========================
     * Validation methods
     * ==========================
     */

    /**
     * Generates a validation function based on specific model validation
     * @param {Object} m model
     * @param {Function} validate validation function
     * @returns {Function} validation
     */
    function generateValidate(m, validate) {
        var max = 10;

        function validate_func() {
            var model = JSON.stringify(m.getObject());
            var c = arguments[0] || 0;
            //TODO: remove validation hotfix
            //while setting this.model is not available
            if(!this._readyOnce) {
                validate(this);
            }
            else {
                validate();
            }
            var model2 = JSON.stringify(m.getObject());
            if (c >= max) {
                utils.error("Max validation loop.");
            } else if (model !== model2) {
                validate_func.call(this, [++c]);
            }
        }
        return validate_func;
    }

    /* ==========================
     * Default options methods
     * ==========================
     */

    /**
     * Generates a valid state based on default options
     */
    function defaultOptions(values, defaults) {

        for (var field in defaults) {

            var blueprint = defaults[field];
            var original = values[field];
            //specified type, default value and possible values
            var type = utils.isObject(blueprint) ? blueprint._type_ : null;
            var defs = utils.isObject(blueprint) ? blueprint._defs_ : null;
            var opts = utils.isObject(blueprint) ? blueprint._opts_ : null;

            //in case there's no type, just deep extend as much as possible
            if (!type) {
                if (typeof original === "undefined") {
                    values[field] = blueprint;
                } else if (utils.isObject(blueprint) && utils.isObject(original)) {

                    values[field] = defaultOptions(original, blueprint);
                }
                continue;
            }

            //otherwise, each case has special verification
            if (type === "number" && isNaN(original)) {
                values[field] = isNaN(defs) ? 0 : defs;
            } else if (type === "string" && typeof original !== 'string') {
                values[field] = (typeof defs === 'string') ? defs : "";
            } else if (type === "array" && !utils.isArray(original)) {
                values[field] = utils.isArray(defs) ? defs : [];
            } else if (type === "object" && !utils.isObject(original)) {
                values[field] = utils.isObject(defs) ? defs : {};
            } else if (type === "model" || type === "hook") {
                if (!utils.isObject(original)) {
                    values[field] = {};
                }
                values[field] = defaultOptions(values[field], defs);
            }

            //if possible values are determined, we should respect it
            if (utils.isArray(opts) && defs && opts.indexOf(values[field]) === -1) {
                utils.warn("Vizabi options contain invalid value for '" + field + "'. Permitted values: " + JSON.stringify(opts) + ". Changing to default");
                values[field] = defs;
            }
        }
        return values;
    }

    Tool.isTool = function(c) {
        return (c._id && c._id[0] === 't');
    }


    Vizabi.Tool = Tool;


}).call(this);