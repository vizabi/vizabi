define([
    'd3',
    'vizabi.managers.layout',
    'vizabi.managers.events',
    'vizabi.managers.data',
    'vizabi.visualizations.template',
    'vizabi.managers.i18n'
], function(d3, LayoutManager, EventsManager, DataManager, Template) {
    var vizID = 1;

    var core = function() {
        this.visualizations = {};

        this.managers = {
            layout: LayoutManager,
            data: DataManager,
            events: EventsManager,
            i18n: i18n
        };
    };

    core.prototype = {
        getId: function() {
            return vizID++;
        },

        getInstance: function(manager) {
            if (manager === 'data') {
                return this.managers.data.instance();
            } else if (manager === 'events') {
                return this.managers.events.instance();
            } else if (manager === 'layout') {
                return this.managers.layout.instance();
            } else if (manager === 'i18n') {
                return this.managers.i18n.instance();
            }
        },

        start: function(viz, selector) {
            if (viz === 'template') {
                var id = this.getId();

                this.visualizations[id] = {
                    type: 'template',
                    id: id,
                    selector: selector,
                    visualization: new Template(this, {
                        id: id,
                        selector: selector
                    }).start()
                };
            }
        },

        stop: function(id) {
            this.visualizations[id].visualization.stop();
        },

        remove: function(id) {
            this.visualizations[id].visualization.remove();
            delete this.visualizations[id];
        }
    };

    return core;
});