//build production
module.exports = function(grunt) {
    //build task: grunt build
    grunt.registerTask('build', [
        'clean', //clean preview and dist folder
        'concat', //generate vizabi unified file
        'uglify', //generate minified version
        'generate_styles', //generate scss
        'sass:prod', //compile scss
        'sass:preview',
        'copy:preview',
        'assemble:prod',
        // 'copy:local_data', //copies local_data
    ]);
};