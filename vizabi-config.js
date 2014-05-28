define([], function() {
    var configs = {
        debug: true,
    
        require: {
            paths: {
                d3: 'bower_components/d3/d3',
                jquery: 'bower_components/jquery/dist/jquery',
                jed: 'bower_components/jed/jed',
                sprintf: 'bower_components/sprintf/src/sprintf',
                base: 'base',
                core: 'core',
                managers: 'managers',
                visualizations: 'visualizations',
                widgets: 'widgets',
                tools: 'tools'
            },
            shim: {
                d3: {
                    exports: 'd3'
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
        }
    };

    require.config(configs.require);

    return configs;
});
