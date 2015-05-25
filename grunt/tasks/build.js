//build production
module.exports = function(grunt) {
    //build task: grunt build
    grunt.registerTask('build', [
        'clean', //clean preview and dist folder
        'concat', //generate vizabi unified file
        // 'includereplace:build', //build AMD wrapper
        // 'write_plugins', //includes all tools and components in plugins.js
        // 'requirejs:dist', //use requirejs for amd module
        'generate_styles', //generate scss
        'sass:prod', //compile scss
        'sass:preview',
        'copy:preview',
        'assemble:prod',
        // 'copy:local_data', //copies local_data
    ]);
};