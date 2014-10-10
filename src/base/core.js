define([
    'jquery',
    'base/class',
    'base/events'
], function($, Class, Events) {

    var tools = {};

    var core = Class.extend({

        init: function() {
            window.addEventListener('resize', function() {
                Events.trigger('resize');
            });
        },

        start: function(tool_path, placeholder, options) {
            var defer = $.Deferred(),
                tool_tokens = tool_path.split("/"),
                tool_name = tool_tokens[tool_tokens.length - 1];


            var path = 'tools/' + tool_path + '/' + tool_name,
                context = this;

            // extending options with name and tool's placeholder
            _.extend(options, {
                name: tool_name,
                placeholder: placeholder
            });

            //placeholder is id because it's unique on the page
            require([path], function(Tool) {
                tools[placeholder] = new Tool(context, options);
                var promise = tools[placeholder].render();
                promise.done(function() {
                    defer.resolve();
                    Events.trigger("resize");
                });

            });

            //bind each of the options
            if(!_.isUndefined(options.bind) && _.isObject(options.bind)) {
                for(var evt_name in options.bind) {
                    var evt = options.bind[evt_name];
                    if(_.isFunction(evt)) {
                        this.bind(evt_name, evt);
                    }
                }
            };

            return defer;
        },

        bind: function(evt, func) {
            Events.bind(evt, func);
        },

        trigger: function(what) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            Events.trigger(what, args);
        },

        setOptions: function(name, options) {
            tools[name].setOptions(options);
        }

    });


    return core;
});