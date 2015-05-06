//requirejs bundles all files
//list of options:
//https://github.com/jrburke/r.js/blob/master/build/preview_page.build.js
module.exports = {
    dist: {
        options: {
            baseUrl: "src/",
            mainConfigFile: "src/config.js",
            out: "dist/vizabi.js",
            optimize: "uglify",
            generateSourceMaps: false,
        }
    }
};