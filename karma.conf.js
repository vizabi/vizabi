// Karma configuration
// Generated on Thu Mar 17 2016 14:30:24 GMT+0200 (EET)

module.exports = function(config) {
  config.set({

    files: [

      // external dependencies
      'node_modules/d3/d3.min.js',
      'node_modules/jasmine-promises/dist/jasmine-promises.js',
      'node_modules/karma-read-json/karma-read-json.js',

      // local sequence dependencies
      'src/base/utils.js',
      'src/base/class.js',
      'src/base/promise.js',
      'src/base/reader.js',
      'src/base/events.js',

      // whole files from base
      'src/base/!(_index).js',
      // whole files from readers
      'src/readers/!(_index.js)/*.js',
      // whole files from components
      'src/components/!(_index.js)/*.js',
      // whole files from helpers
      'src/helpers/!(_index).js',
      // whole files from models
      'src/models/hook.js',
      'src/models/!(_index).js',
      // whole files from tools
      'src/tools/!(_index.js)/*.js',

      // whole files from tests
      'test/unit/**/*.js',
      'test/unit/**/**/*.js',

      // csv datapoints info
      {pattern: '.data/ddf/ddf--gapminder_world/output/ddf/*.csv', watched: false, included: false, served: true},

      // fixtures
      {pattern: 'test/fixture/*.json', watched: false, included: false, served: true},
      {pattern: 'test/fixture/*.csv', watched: false, included: false, served: true},
      {pattern: 'test/fixture/*.html', watched: false, included: true, served: true}
    ],

    preprocessors: {
      // pre-process project files
      'src/base/*.js': ['babel', 'coverage'],
      'src/readers/**/*.js': ['babel', 'coverage'],
      'src/components/**/*.js': ['babel', 'coverage'],
      'src/helpers/*.js': ['babel', 'coverage'],
      'src/models/*.js': ['babel', 'coverage'],
      'src/tools/**/*.js': ['babel', 'coverage'],

      // pre-process test files
      'test/unit/**/*.js': ['babel']
    },

    coverageReporter:{
      type:'html',
      dir:'./test/coverage-report'
    },

    babelPreprocessor: {
      options: {
        "presets": ['es2015'],
        "plugins": ["transform-es2015-modules-umd"],
        "sourceMap": 'inline',
        "compact": false
      }
    },

    reporters: [
      'mocha',
      'coverage'
    ],

    frameworks: [
      'jasmine',
      'es6-shim',
      'phantomjs-shim'
    ],

    basePath: '',
    exclude: [],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false,
    concurrency: Infinity,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO
  })
}
