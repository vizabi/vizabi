/*
 * ---------
 * Building preview pages with assemble
 */

module.exports = function(grunt) {

    //default task: grunt
    grunt.registerTask('preview', [
        'clean:preview',
        'sass:prod',
        'copy:preview',
        'assemble:prod',
        'watch:preview'
    ]);

};