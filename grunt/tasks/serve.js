//serve production code
module.exports = function(grunt) {
    grunt.registerTask('serve', [
        'default', //default build
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);
};