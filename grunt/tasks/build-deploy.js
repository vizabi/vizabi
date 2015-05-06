//build and deploy
module.exports = function(grunt) {
    grunt.registerTask('build-deploy', [
        'default',
        'deploy'
    ]);
};