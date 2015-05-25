/*
 * ---------
 * Building preview pages with assemble
 */

module.exports = function(grunt) {

    //default task: grunt
    grunt.registerTask('preview', [
        'sass:preview',
        'copy:preview',
        'assemble:dev'
    ]);

};