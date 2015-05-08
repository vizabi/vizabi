//build production
module.exports = function(grunt) {
    //build task: grunt build
    grunt.registerTask('build', [
        'clean', //clean preview and dist folder
        'includereplace:build', //build AMD wrapper
        'write_plugins', //includes all tools and components in plugins.js
        'requirejs:dist', //use requirejs for amd module
        'generate_styles', //generate scss
        'sass:prod', //compile scss
        // 'preview_pages_menu', //build preview_pages menu template
        // 'includereplace:preview_pages_build', //preview_pages folder
        // 'preview_pages_index', //build preview_pages
        //preview pages
        'sass:preview',
        'copy:preview',
        'assemble:prod',
        'copy:local_data', //copies local_data
    ]);
};