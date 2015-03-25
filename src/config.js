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

        //library dependencies
        d3: '../lib/d3/d3',
        d3genericLogScale: '../src/base/d3.genericLogScale',
        d3axisWithLabelPicker: '../src/base/d3.axisWithLabelPicker',
        d3collisionResolver: '../src/base/d3.collisionResolver',
        lodash: '../lib/lodash/dist/lodash',
        text: '../lib/requirejs-text/text',
        stacktrace: '../lib/stacktrace-js/dist/stacktrace',
        q: '../lib/q/q',
        req: '../lib/reqwest/reqwest.min'
    },
    shim: {
        d3: {
            exports: 'd3'
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

    include: "vizabi-amd"
});
