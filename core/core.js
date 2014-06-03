define([
    'd3',
    'base/object',
    'vizabi-config',
    'managers/events/events',
    'managers/layout/layout',
    'managers/data/data',
    'i18n' 
], function(d3, baseObject, config, EventsManager, LayoutManager, DataManager, i18nManager) {

    var extend = baseObject.extend;
    var vizID = 1;
    var managers = {
        events: EventsManager,
        layout: LayoutManager,
        data: DataManager,
        i18n: i18nManager
    };

    var core = function() {
        this.visualizations = {};
        
        var context = this;
        
        window.addEventListener('resize', function() {
            context.managers['events'].trigger('resize');
        });
    };

    core.prototype = {
        getId: function() {
            return vizID++;
        },

        getInstance: function(manager) {
            return managers[manager].instance();
        },

        getVisualization: function(id) {
            if (!id) return this.visualizations;
            if (this.visualizations[id]) return this.visualizations[id];
            return null;
        },

        start: function(tool_name, placeholder, state) {

            var id = this.getId();
            var context = this;
            var opt = extend({}, options);

            var t_path = config.require.paths.visualizations;
            var path = t_path + '/' + tool_name + '/' + tool_name;

            require([path], function(tool) {
                //TODO tool.start();
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
