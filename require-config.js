require.config({
    paths: {
        d3: 'bower_components/d3/d3',
        jquery: 'bower_components/jquery/dist/jquery',
        jed: 'bower_components/jed/jed',
        sprintf: 'bower_components/sprintf/src/sprintf',

        // Base dir
        'vizabi': '',

        // Config
        'vizabi.config': 'config/config',

        // Base
        'vizabi.base.object': 'base/object/object',
        'vizabi.base.loader.json': 'base/loader/json',
        'vizabi.base.svg.rectBox': 'base/svg/rectBox',

        // Core
        'vizabi.core': 'http://core/vizabi',

        // Managers
        'vizabi.managers.layout': 'managers/layout/layout-manager',
        'vizabi.managers.events': 'managers/events/events',
        'vizabi.managers.data': 'managers/data/data',
        'vizabi.managers.i18n': 'managers/i18n/i18n',

        // Manager helpers
        'vizabi.managers.data.cache': 'managers/data/cache',

        // Widgets
        'vizabi.widgets.text': 'widgets/text/text',

        // Interactive Visualizations
        'vizabi.visualizations.template': 'interactive-visualizations/template'
    },
    shim: {
        d3: {
            exports: 'd3'
        }
    }
});