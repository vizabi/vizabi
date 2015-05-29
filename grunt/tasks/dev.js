//main developer task
module.exports = function(grunt) {
    grunt.registerTask('dev', [
        'build',
        'jshint:all',
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);

    grunt.registerTask('dev:test', [
        'default',
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);
};