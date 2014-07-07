define([
    'jquery',
    'config',
    'base/class',
    'managers/events',
    'managers/layout',
    'i18n'
], function($, config, Class, EventsManager, LayoutManager, DataManager, i18nManager) {

    var vizID = 1,
        tools = {},
        managers = {
            events: EventsManager,
            layout: new LayoutManager(),
            i18n: i18nManager
        };

    var core = Class.extend({

        init: function() {
            window.addEventListener('resize', function() {
                managers['events'].trigger('resize');
            });
        },

        //TODO: make it possible for two tools with the same name to co-exist
        start: function(tool_name, placeholder, options) {
            var defer = $.Deferred();

            var t_path = config.require.paths.tools,
                path = t_path + '/' + tool_name + '/' + tool_name,
                context = this;

            // extending options with name and tool's placeholder
            _.extend(options, {
                name: tool_name,
                placeholder: placeholder
            });

            require([path], function(Tool) {
                tools[tool_name] = new Tool(context, options);
                var promise = tools[tool_name].render();
                promise.done(function() {
                    defer.resolve();
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

        //TODO: remove ifs
        getInstance: function(manager) {
            if (manager === "layout") return new LayoutManager();
            if (manager === "events") return managers[manager];
            return managers[manager].instance();
        },

        bind: function(evt, func) {
            EventsManager.bind(evt, func);
        },

        trigger: function(what) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            EventsManager.trigger(what, args);
        },

        setOptions: function(name, options) {
            tools[name].setOptions(options);
        }

    });


    return core;
});