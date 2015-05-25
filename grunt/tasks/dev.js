//main developer task
module.exports = function(grunt) {
    grunt.registerTask('dev', [
        'default', //default build
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);
};