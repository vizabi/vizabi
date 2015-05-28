module.exports = function(grunt) {
    //default task: grunt
    grunt.registerTask('default', [
        'build',
        'jasmine',
        'jshint:all',
        'replace:test',
        'copy:test',
        'clean:test'
    ]);
};