//main developer task
module.exports = function(grunt) {
    grunt.registerTask('dev', [
        'dev-preview', //copies source to preview
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);
};