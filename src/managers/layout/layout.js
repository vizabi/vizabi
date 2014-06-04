define([
    "underscore",
    "base/class",
    "config"
], function(_, Class, config) {

    var layoutManager = Class.extend({

        init: function() {
            this.screen_sizes = config.screen_sizes;  //accepted sizes
            this.container = null;                    //d3 container
            this.profiless = {};                       
            this.current_profiles = null;
        },

        update: function() {
            var _this = this,
                width = this.width();
            
            //remove size classes and find correct one
            _.each(this.screen_sizes, function(range, size) {
                //remove class
                _this.container.classed(size, false);
                //find best fit
                if(width >= range.min_width && width <= range.max_width) {
                    _this.current_profile = size;
                }
            });

            //update size class
            _this.container.classed(_this.current_profile, true);

            //TODO: move this comment to wiki
            /* toggle, untoggle classes based on profile
             * whenever a size has related classes turned off, you see the 
             * corresponding class with the suffix -off
             * example: small { timeslider: false } would produce
             * a class timeslider-off when the screen is small
             */
            var profile = this.profiles[_this.current_profile] || this.profiles["default"];
            if(profile) {
                _.each(profile, function(value, item) {
                    _this.container.classed(item+"-off", !value);
                });
            }

            //toggle, untoggle classes based on orientation
            var portrait = this.portrait();
            _this.container.classed("portrait", portrait);
            _this.container.classed("landscape", !portrait);
        },

        setProfile: function(profile, profiles) {
            if(_.isString(profile)) {
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
            return parseInt(this.container.style("width"),10);
        },

        height: function() {
            return parseInt(this.container.style("height"),10);
        }

    });

    return layoutManager;

});