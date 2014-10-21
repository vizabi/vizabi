define([
    "underscore",
    "base/class"
], function(_, Class) {

    //classes are vzb-portrait, vzb-landscape...
    var class_prefix = "vzb-",
        class_portrait = class_prefix + "portrait",
        class_lansdcape = class_prefix + "vzb-landscape";

    var layoutManager = Class.extend({

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
        },

        update: function() {
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
            var portrait = this.portrait();
            this.container.classed(class_portrait, portrait);
            this.container.classed(class_lansdcape, !portrait);

            this.events.trigger('resize');
        },

        setProfile: function(profile, profiles) {
            if (_.isString(profile)) {
                this.profiles[profile] = profiles;
            } else {
                this.profiles = profile;
            }
        },

        getProfile: function(name) {
            return this.profiles[name];
        },

        setContainer: function(container) {
            this.container = container;
        },

        currentProfile: function() {
            return this.current_profile
        },

        size: function() {
            return {
                width: this.width(),
                height: this.height()
            }
        },

        portrait: function() {
            return this.width() < this.height();
        },

        width: function() {
            return parseInt(this.container.style("width"), 10);
        },

        height: function() {
            return parseInt(this.container.style("height"), 10);
        }

    });

    return layoutManager;

});