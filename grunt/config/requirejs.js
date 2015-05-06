//requirejs bundles all files
//list of options:
//https://github.com/jrburke/r.js/blob/master/build/preview_page.build.js
module.exports = {
    preview: {
        options: {
            baseUrl: "src/",
            mainConfigFile: "src/config.js",
            out: "preview/vizabi.js",
            optimize: "uglify",
            generateSourceMaps: false,
        }
    },

    pretty: {
        options: {
            baseUrl: "src/",
            mainConfigFile: "src/config.js",
            out: "preview/vizabi.js",
            generateSourceMaps: false,
        }
    }
};