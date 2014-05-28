define([
    'd3',
    'base/object',
    'vizabi-config',
    'managers/managers'
], function(d3, baseObject, config, Managers) {
    var extend = baseObject.extend;
    var vizID = 1;

    function createVisualization(options, callback) {
        var vPath = config.require.paths.visualizations;
        var vName = options.name;
        var path = vPath + '/' + vName + '/' + vName;

        require([path], function(Viz) {
            callback(Viz, options);
        });
    }

    var core = function() {
        this.visualizations = {};
        this.managers = Managers;
        
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

        start: function() {
            
        },

        destroy: function(id) {
            
        },

        spawn: function(options, fn) {
            var id = this.getId();
            var context = this;
            var opt = extend({}, options);

            createVisualization(opt, function(Viz) {
                var res = new Viz(context, opt);
                context.visualizations[id] = res;
                if (typeof fn === 'function') fn(res);
            });

            return id;
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
