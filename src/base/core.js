define([
    'jquery',
    'base/class',
    'base/events'
], function($, Class, Events) {

    var tool;

    var core = Class.extend({

        init: function() {
            //events instance triggers events to the outside world
            this.events = new Events();
        },

        start: function(tool_path, placeholder, options) {
            var defer = $.Deferred(),
                tool_tokens = tool_path.split("/"),
                tool_name = tool_tokens[tool_tokens.length - 1];


            var path = 'tools/' + tool_path + '/' + tool_name,
                _this = this;

            // extending options with name and tool's placeholder
            _.extend(options, {
                name: tool_name,
                placeholder: placeholder
            });

            //placeholder is id because it's unique on the page
            require([path], function(Tool) {
                tool = new Tool(_this, options);

                //bind external events after loading
                //when anything changes in the tool, trigger event
                tool.on("change", function(evt, values) {
                    _this.events.trigger(evt, values);
                });

                var promise = tool.render();
                promise.done(function() {
                    defer.resolve();
                });

            });

            //bind each of the options
            if (!_.isUndefined(options.bind) && _.isObject(options.bind)) {
                for (var evt_name in options.bind) {
                    var evt = options.bind[evt_name];
                    if (_.isFunction(evt)) {
                        this.bind(evt_name, evt);
                    }
                }
            };

            return defer;
        },

        on: function(evt, func) {
            this.bind(evt, func);
        },

        bind: function(evt, func) {
            this.events.bind(evt, func);
        },

        setOptions: function(options) {
            tool.setOptions(options);
        }

    });


    return core;
});