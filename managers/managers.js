define([
    'managers/layout/layout',
    'managers/events/events',
    'managers/data/data',
    'i18n'
], function(Layout, Events, Data, i18n) {
    return {
        layout: Layout,
        events: Events,
        data: Data,
        i18n: i18n
    }
});