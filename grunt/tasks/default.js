module.exports = function(grunt) {
    //default task: grunt
    grunt.registerTask('default', [
        'build', //by default, just build and test
        'test:copy',
        'jasmine:prod',
        // 'copy:dist' //copies dist files
    ]);
};