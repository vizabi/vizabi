define([
    'vizabi-config',
    'managers/events/events',
    'managers/layout/layout',
    'managers/data/data',
    'i18n' 
], function(config, EventsManager, LayoutManager, DataManager, i18nManager) {

    var vizID = 1,
        tools = {},
        managers = {
            events: EventsManager,
            layout: LayoutManager,
            data: DataManager,
            i18n: i18nManager
        };

    var core = function() {
        window.addEventListener('resize', function() {
            managers['events'].trigger('resize');
        });
    };

    core.prototype = {
        getId: function() {
            return vizID++;
        },

        getInstance: function(manager) {
            return managers[manager].instance();
        },

        getTool: function(id) {
            if (!id) return tools;
            if (tools[id]) return tools[id];
            return null;
        },

        start: function(tool_name, placeholder, state, ready) {

            var id = this.getId(),
                t_path = config.require.paths.tools,
                path = t_path + '/' + tool_name + '/' + tool_name,
                context = this,
                option = {
                    placeholder: placeholder,
                    state: state
                }

            require([path], function(Tool) {
                tools[id] = new Tool(context, option);
                tools[id].start();
            });

            return id;
        },

        destroy: function(id) {
            
        },
        bind: function(evt, func) {
            EventsManager.bind(evt, func);
        },

        trigger: function(what) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            EventsManager.trigger(what, args);
        }
    };

    return core;
});
