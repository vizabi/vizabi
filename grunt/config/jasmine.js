//run tests
module.exports = {
    dev: {
        src: 'preview/vizabi.js',
        options: {
            outfile: 'test.html',
            keepRunner: true,
            specs: 'spec/**/*-spec.js',
            helpers: 'spec/**/*-helper.js',
            host: 'http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/',
            template: require('grunt-template-jasmine-requirejs'),
            templateOptions: {
                requireConfigFile: 'preview/config.js',
                requireConfig: {
                    baseUrl: 'preview/'
                }
            },
            styles: ['preview/vizabi.css', 'spec/spec.css'],
            vendor: ['preview/assets/js/jquery.min.js']
        }
    },
    prod: {
        src: 'dist/vizabi.js',
        options: {
            outfile: 'test.html',
            specs: 'spec/**/*-spec.js',
            helpers: 'spec/**/*-helper.js',
            styles: ['dist/vizabi.css', 'spec/spec.css'],
            vendor: ['preview/assets/js/jquery.min.js'],
            page: {
                //laptopsize
                viewportSize: {
                    width: 1280,
                    height: 768
                }
            }
        }
    }
};