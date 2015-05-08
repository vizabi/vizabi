/*
 * ---------
 * Building preview pages with assemble
 */

module.exports = function(grunt) {

    //default task: grunt
    grunt.registerTask('preview', [
        'sass:preview',
        'copy:preview',
        'copy:preview_require',
        'assemble:dev'
    ]);

    grunt.registerTask('preview-prod', [
        'sass:preview',
        'copy:preview',
        'assemble:prod'
    ]);

};