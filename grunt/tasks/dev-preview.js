//developer task: grunt dev
module.exports = function(grunt) {
    grunt.registerTask('dev-preview', [
        'clean:preview', //clean preview folder
        'write_plugins', //includes all tools and components in plugins.js
        'generate_styles', //generate scss
        'sass:dev', //compile scss
        'preview_pages_menu', //build preview_pages menu template
        'includereplace:preview_pages_dev', //preview_pages folder
        'preview_pages_index', //build preview_pages
        'copy:scripts',
        'copy:templates',
        'copy:preview_pages', //copies preview_page assets
        'copy:local_data', //copies local_data
        'copy:assets', //copies assets
        'jshint:all'
    ]);
};