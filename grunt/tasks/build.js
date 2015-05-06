//build production
module.exports = function(grunt) {
    //build task: grunt build
    grunt.registerTask('build', [
        'clean', //clean preview and dist folder
        'includereplace:build', //build AMD wrapper
        'write_plugins', //includes all tools and components in plugins.js
        'requirejs:preview', //use requirejs for amd module
        'generate_styles', //generate scss
        'sass:preview', //compile scss
        'preview_pages_menu', //build preview_pages menu template
        'includereplace:preview_pages_build', //preview_pages folder
        'preview_pages_index', //build preview_pages
        'copy:preview_pages', //copies preview_page assets
        'copy:local_data', //copies local_data
        'copy:assets', //copies assets
    ]);
};