define([
    'd3',
    'base/object',
    'vizabi-config',
<<<<<<< HEAD
    'managers/events'
], function(d3, baseObject, config, events) {
=======
    'managers/events/events',
    'managers/layout/layout',
    'managers/data/data',
    'i18n' 
], function(d3, baseObject, config, EventsManager, LayoutManager, DataManager, i18nManager) {
    // Please remove me soon (when gruntfile is adjusted)
    if (!window.d3) window.d3 = d3;
>>>>>>> 3710ae349918621da284289e1d6f6cdb2630b6c9

    var extend = baseObject.extend;
    var vizID = 1;

    function createVisualization(tool, callback) {
        var vPath = config.require.paths.visualizations;
        var vName = tool;
        var path = vPath + '/' + vName + '/' + vName;

        require([path], function(Viz) {
            callback(Viz, options);
        });
    }

    var core = function() {
        this.visualizations = {};
        this.managers = {
            events: EventsManager,
            layout: LayoutManager,
            data: DataManager,
            i18n: i18nManager
        };
        
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
            return this.managers[manager].instance();
        },

        getVisualization: function(id) {
            if (!id) return this.visualizations;
            if (this.visualizations[id]) return this.visualizations[id];
            return null;
        },

        start: function(tool, placeholder, state) {

            var id = this.getId();
            var context = this;
            var opt = extend({}, options);

            var t_path = config.require.paths.visualizations;
            var path = t_path + '/_examples/' + tool + '/' + tool;

            require([path], function(Viz) {
                callback(Viz, options);
            });

            return id;
        },

        destroy: function(id) {
            
        },
        bind: function(evt, func) {
            this.managers['events'].bind(evt, func);
        },

        trigger: function(what) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            this.managers['events'].trigger(what, args);
        }
    };

    return core;
});
