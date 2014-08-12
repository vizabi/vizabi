define([], function() {
    var configs = {
        debug: true,

        require: {
            baseUrl: "../../dist/",
            text: {
                optimizeAllPluginResources: true
            },
            paths: {
                base: 'base',
                tools: 'tools',
                components: 'components',
                readers: 'readers',

                d3: '../bower_components/d3/d3',
                jquery: '../bower_components/jquery/dist/jquery',
                underscore: '../bower_components/underscore/underscore',

                jed: '../bower_components/jed/jed',
                sprintf: '../bower_components/sprintf/src/sprintf',
                i18n: '../bower_components/i18n-js/i18n',
                
                text: '../bower_components/requirejs-text/text',
                smartpicker: '../bower_components/smart-picker/dist/smart-picker',

                //TODO: Move this to timeslider2 (component-specific)
                //https://github.com/jrburke/r.js/blob/master/build/example.build.js#L35
                jqueryui_slider: '../bower_components/jqueryui/ui/minified/jquery.ui.slider.min',
                jqueryui_core: '../bower_components/jqueryui/ui/minified/jquery.ui.core.min',
                jqueryui_mouse: '../bower_components/jqueryui/ui/minified/jquery.ui.mouse.min',
                jqueryui_widget: '../bower_components/jqueryui/ui/minified/jquery.ui.widget.min'
            },
            shim: {
                d3: {
                    exports: 'd3'
                },
                i18n: {
                    deps: ['jed', 'sprintf', 'jquery'],
                    exports: 'i18n'
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
                           'jqueryui_widget']
                }
            }
        },

        vizabi: {
            po: 2
        },

        url: {
            oven: {
                base: 'http://oven.gapminder.org:9990', //'{{oven-url}}'
                api: {

                }
            },

            cms: {
                base: 'http://stage.cms.gapminder.org', //'{{cms-url}}'
                api: {
                    // sprintf fortmatted string
                    po: '/api/i18nCatalog/poJson?id=%(filename)s&lang=%(lang)s',
                }
            }
        },

        screen_sizes: {
            small: {
                min_width: 0,
                max_width: 749,
            },
            medium: {
                min_width: 750,
                max_width: 969,
            },
            large: {
                min_width: 970,
                max_width: Infinity,
            }
        }
    };
    return configs;
});