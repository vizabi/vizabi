define([
    'managers/layout/layout',
    'managers/events/events',
    'managers/data/data',
    'bower_components/i18n-js/i18n'
], function(Layout, Events, Data) {
    return {
        layout: Layout,
        events: Events,
        data: Data,
        i18n: i18n
    }
});