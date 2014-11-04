define([
    "lodash",
    "base/events",
    "base/class"
], function(_, Events, Class) {

    //classes are vzb-portrait, vzb-landscape...
    var class_prefix = "vzb-",
        class_portrait = class_prefix + "portrait",
        class_lansdcape = class_prefix + "landscape";

    var layoutManager = Class.extend({

        /**
         * Initializes the layout manager
         */
        init: function() {

            //TODO: Remove screen sizes from here
            this.screen_sizes = {
                small: {
                    min_width: 0,
                    max_width: 749,
                },
                medium: {
                    min_width: 750,
                    max_width: 969,
                },
                large: {
                    min_width: 970,
                    max_width: Infinity,
                }
            };
            this.container = null; //d3 container
            this.profiles = {};
            this.current_profiles = null;

            //capture layout events
            this._events = new Events();

            //resize when window resizes
            var _this = this;

            //QUESTION: should this be global like this here?
            window.addEventListener('resize', function() {
                if (_this.container) {
                    _this.resize();
                }
            });
        },

        /**
         * Calculates the size of the newly resized container
         */
        resize: function() {
            var _this = this,
                width = this.width();

            //remove size classes and find correct one
            _.each(this.screen_sizes, function(range, size) {
                //remove class
                _this.container.classed(class_prefix + size, false);
                //find best fit
                if (width >= range.min_width && width <= range.max_width) {
                    _this.current_profile = size;
                }
            });

            //update size class
            this.container.classed(class_prefix + _this.current_profile, true);

            //TODO: move this comment to wiki
            /* toggle, untoggle classes based on profile
             * whenever a size has related classes turned off, you see the
             * corresponding class with the suffix -off
             * example: small { timeslider: false } would produce
             * a class viz-timeslider-off when the screen is small
             */
            var profile = this.profiles[_this.current_profile] || this.profiles["default"];
            if (profile) {
                _.each(profile, function(value, item) {
                    _this.container.classed(class_prefix + item + "-off", !value);
                });
            }

            //toggle, untoggle classes based on orientation
            var portrait = this.isPortrait();
            this.container.classed(class_portrait, portrait);
            this.container.classed(class_lansdcape, !portrait);

            this.trigger('resize');
        },

        /**
         * Sets profiles for the current layout
         */
        //todo: potentially remove profiles and simplify to screen sizes
        setProfile: function(profile, profiles) {
            if (_.isString(profile)) {
                this.profiles[profile] = profiles;
            } else {
                this.profiles = profile;
            }
        },

        /**
         * Gets the configuration for a certain profile
         * @param {String} name name of profile
         * @returns {Object} profile configuration
         */
        getProfile: function(name) {
            return this.profiles[name];
        },

        /**
         * Sets the container for this layout (reference size)
         * @param container d3 container
         */
        setContainer: function(container) {
            this.container = container;
        },

        /**
         * Gets the current selected profile
         * @param container d3 container
         * @returns {String} name of current profile
         */
        currentProfile: function() {
            return this.current_profile
        },

        /**
         * Gets the size of container
         * @returns {Object} size, width and height
         */
        size: function() {
            return {
                width: this.width(),
                height: this.height()
            }
        },

        /**
         * Checks whether it's portrait
         * @returns {Boolean}
         */
        isPortrait: function() {
            return this.width() < this.height();
        },

        /**
         * Gets the width
         * @returns {Number}
         */
        //todo: improve getter
        width: function() {
            return (this.container) ? parseInt(this.container.style("width"), 10) : 0;
        },

        /**
         * Gets the height
         * @returns {Number}
         */
        //todo: improve getter
        height: function() {
            return (this.container) ? parseInt(this.container.style("height"), 10) : 0;
        },

        /**
         * Destroys this instance
         */
        destroy: function() {
            this._events = new Events();
            this.container = null;
            this.profiles = {};
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

    return layoutManager;

});