module.exports = function(grunt) {
    //default task: grunt
    grunt.registerTask('default', [
        'build', //by default, just build and test
        'jasmine:prod',
        'jshint:all',
        // 'copy:dist' //copies dist files
    ]);
};