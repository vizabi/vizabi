//new build
module.exports = function(grunt) {
    //build task: grunt build
    grunt.registerTask('new', [
        'clean', //clean preview and dist folder
        'concat'
    ]);
};