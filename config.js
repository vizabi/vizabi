define({
    require: {
        path: {
            visualizations: 'visualizations/',
            managers: 'managers/'
        }
    },
    id: {
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
});
