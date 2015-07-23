module.exports = function(grunt) {
    //default task: grunt
    grunt.registerTask('default', [
        'build',
//        'jasmine',
//        'replace:test',
//        'copy:test',
//        'clean:test',
        'jshint:all'
    ]);
};