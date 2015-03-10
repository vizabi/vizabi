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

            //TODO: Remove screen sizes from here ?
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
            this.current_profile = null;
            this._prev_size = null;

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
                width = this.width(),
                height = this.height();

            if(this._prev_size && this._prev_size.width === width && this._prev_size.height === height) return;

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

            //toggle, untoggle classes based on orientation
            var portrait = this.isPortrait();
            this.container.classed(class_portrait, portrait);
            this.container.classed(class_lansdcape, !portrait);

            this.trigger('resize');

            this._prev_size = _.clone(this.size());
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
            this._events.trigger(this, name, val);
        },

        /**
         * Triggers an event from this model and all parent events
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        triggerAll: function(name, val) {
            this._events.triggerAll(this, name, val);
        }

    });

    return layoutManager;

});
