//developer task: grunt dev
module.exports = function(grunt) {
    grunt.registerTask('dev-preview', [
        'clean:preview', //clean preview folder
        'write_plugins', //includes all tools and components in plugins.js
        'generate_styles', //generate scss
        'sass:dev', //compile scss
        'preview', //builds preview pages
        'copy:scripts',
        'copy:templates',
        'copy:local_data', //copies local_data
        'jshint:all'
    ]);
};