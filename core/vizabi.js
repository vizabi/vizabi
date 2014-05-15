define([
    'd3',
    'vizabi.managers.layout',
    'vizabi.managers.events',
    'vizabi.managers.data',
    'vizabi.managers.i18n',
    'vizabi.visualizations.template',
    'vizabi.visualizations.income-mountain'
], function(d3, LayoutManager, EventsManager, DataManager, thei18n, Template, IncomeMountain) {
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
            var id = this.getId();

            if (viz === 'template') {
                this.visualizations[id] = {
                    type: 'template',
                    id: id,
                    selector: selector,
                    visualization: new Template(this, {
                        id: id,
                        selector: selector
                    }).start()
                };
            } else if (viz === 'income-mountain') {
                this.visualizations[id] = {
                    type: 'income-mountain',
                    id: id,
                    selector: selector,
                    visualization: new IncomeMountain(this, {
                        id: id,
                        selector: selector
                    }).start()
                };
            }

            window.addEventListener('resize', function() {
                EventsManager.trigger('resize');
            });
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