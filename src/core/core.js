define([
    'jquery',
    'config',
    'base/class',
    'managers/events/events',
    'managers/layout/layout',
    'managers/data/data',
    'i18n'
], function($, config, Class, EventsManager, LayoutManager, DataManager, i18nManager) {

    var vizID = 1,
        tools = {},
        managers = {
            events: EventsManager,
            layout: new LayoutManager(),
            data:   new DataManager(),
            i18n:   i18nManager
        };

    var core = Class.extend({

        init: function() {
            this.name = 'vizabi core';
            window.addEventListener('resize', function() {
                managers['events'].trigger('resize');
            });
        },

        start: function(tool_name, placeholder, options) {
            var defer = $.Deferred();

            var id = getId(),
                t_path = config.require.paths.tools,
                path = t_path + '/' + tool_name + '/' + tool_name,
                context = this;
                
            // extending options with name and tool's placeholder
            _.extend(options, {
                name: tool_name,
                placeholder: placeholder
            });

            require([path], function(Tool) {
                tools[id] = new Tool(context, options);
                var promise = tools[id].render();
                promise.done(function() {
                    defer.resolve();
                });

            });

            return defer;
        },

        getInstance: function(manager) {
            if(manager === "layout") return new LayoutManager();
            if(manager === "events") return managers[manager];
            if (manager === 'dataManager') return managers['data'];
            return managers[manager].instance();
        },

        getTool: function(id) {
            if (!id) return tools;
            if (tools[id]) return tools[id];
            return null;
        },

        destroy: function() {},

        bind: function(evt, func) {
            EventsManager.bind(evt, func);
        },

        trigger: function(what) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            EventsManager.trigger(what, args);
        }

    });

    function getId() {
        return vizID++;
    }

    return core;
});
