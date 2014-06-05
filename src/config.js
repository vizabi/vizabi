define([], function() {
    var configs = {
        debug: true,
    
        require: {
            baseUrl: "../dist/",
            text: {
                optimizeAllPluginResources: true
            },
            paths: {
                d3: '../bower_components/d3/d3',
                jquery: '../bower_components/jquery/dist/jquery',
                underscore: '../bower_components/underscore/underscore',
                jed: '../bower_components/jed/jed',
                sprintf: '../bower_components/sprintf/src/sprintf',
                i18n: '../bower_components/i18n-js/i18n',
                base: 'base',
                core: 'core/core',
                managers: 'managers',
                tools: 'tools',
                components: 'components',
                text: '../bower_components/requirejs-text/text'
            },
            shim: {
                d3: {
                    exports: 'd3'
                },
                i18n: {
                    deps: ['jed', 'sprintf', 'jquery'],
                    exports: 'i18n'
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
