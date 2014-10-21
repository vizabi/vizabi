//Main Src File
require.config({
    text: {
        optimizeAllPluginResources: true
    },
    paths: {
        base: 'base',
        tools: 'tools',
        components: 'components',
        models: 'models',
        readers: 'readers',

        d3: '../lib/d3/d3',
        jquery: '../lib/jquery/dist/jquery',
        underscore: '../lib/underscore/underscore',

        text: '../lib/requirejs-text/text',
        smartpicker: '../lib/smart-picker/dist/smart-picker',

        //TODO: Move this to timeslider2 (component-specific)
        //https://github.com/jrburke/r.js/blob/master/build/example.build.js#L35
        jqueryui_slider: '../lib/jqueryui/ui/minified/jquery.ui.slider.min',
        jqueryui_core: '../lib/jqueryui/ui/minified/jquery.ui.core.min',
        jqueryui_mouse: '../lib/jqueryui/ui/minified/jquery.ui.mouse.min',
        jqueryui_widget: '../lib/jqueryui/ui/minified/jquery.ui.widget.min'
    },
    shim: {
        d3: {
            exports: 'd3'
        },
        smartpicker: {
            deps: ['underscore', 'jquery'],
            exports: 'smartpicker'
        },
        jqueryui_core: {
            deps: ['jquery']
        },
        jqueryui_widget: {
            deps: ['jquery']
        },
        jqueryui_mouse: {
            deps: ['jqueryui_widget']
        },
        jqueryui_slider: {
            deps: ['jquery',
                'jqueryui_core',
                'jqueryui_mouse',
                'jqueryui_widget'
            ]
        }
    },

    name: "../lib/almond/almond",

    removeCombined: true,
    findNestedDependencies: true,
    wrap: {
        startFile: 'build/wrap-begin.frag',
        endFile: 'build/wrap-end.frag'
    },
    preserveLicenseComments: false,
    //optimize: "uglify",
    //generateSourceMaps: false,

    //allow text! require
    inlineText: true,

    // exclude: [
    //             "jquery",
    //             "d3"
    //         ],

    include: "vizabi-amd"
});