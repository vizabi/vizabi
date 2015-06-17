/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function() {
    'use strict';
    var class_loading = 'vzb-loading';
    var class_loading_data = 'vzb-loading';
    var class_loading_error = 'vzb-loading-error';
    var class_placeholder = 'vzb-placeholder';
    var class_buttons_off = 'vzb-buttonlist-off';
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
            this._id = utils.uniqueId('tm');
            this._type = 'tool';
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
                this.on('change:language', function() {
                    _this.trigger('translate');
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
            this._id = utils.uniqueId('t');
            this.layout = new Vizabi.Layout();
            this.template = this.template || '<div class="vzb-tool vzb-tool-' + this.name + '"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div></div></div>';
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
            if (!this.model.bind) {
                return;
            }
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
        validate: function() {},
        _setUIOptions: function() {
            //add placeholder class
            utils.addClass(this.placeholder, class_placeholder);
            //add-remove buttonlist class
            if (!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
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
            if (!this._readyOnce) {
                validate(this);
            } else {
                validate();
            }
            var model2 = JSON.stringify(m.getObject());
            if (c >= max) {
                utils.error('Max validation loop.');
            } else if (model !== model2) {
                validate_func.call(this, [c += 1]);
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
        var keys = Object.keys(defaults);
        var size = keys.length;
        var field;
        var blueprint;
        var original;
        var type;
        for (var i = 0; i < size; i += 1) {
            field = keys[i];
            if (field === '_defs_') {
                continue;
            }
            blueprint = defaults[field];
            original = values[field];
            type = typeof blueprint;
            if (type === 'object') {
                type = utils.isPlainObject(blueprint) && blueprint._defs_ ? 'object' : utils.isArray(blueprint) ? 'array' : 'model';
            }
            if (typeof original === 'undefined') {
                if (type !== 'object' && type !== 'model') {
                    values[field] = blueprint;
                } else {
                    values[field] = defaultOptions({}, blueprint);
                }
            }
            original = values[field];
            if (type === 'number' && isNaN(original)) {
                values[field] = 0;
            } else if (type === 'string' && typeof original !== 'string') {
                values[field] = '';
            } else if (type === 'array' && !utils.isArray(original)) {
                values[field] = [];
            } else if (type === 'model') {
                if (!utils.isObject(original)) {
                    values[field] = {};
                }
                values[field] = defaultOptions(values[field], blueprint);
            } else if (type === 'object') {
                if (!utils.isObject(original) || Object.keys(original).length === 0) {
                    original = false; //will be overwritten
                }
                if (!utils.isObject(blueprint._defs_)) {
                    blueprint._defs_ = {};
                }
                values[field] = original || blueprint._defs_;
            }
        }
        return values;
    }

    //utility function to check if a component is a tool
    //TODO: Move to utils?
    Tool.isTool = function(c) {
        return c._id && c._id[0] === 't';
    };

    Vizabi.Tool = Tool;
}.call(this));