//testing
module.exports = function(grunt) {
    grunt.registerTask('test', function() {
        grunt.task.run([
            'build',
            'jasmine:prod'
        ]);
    });

    grunt.registerTask('test:dev', function() {
        grunt.option('force', true);
        grunt.task.run([
            'build',
            'jasmine:dev:build',
            'connect:test', //run locally
        ]);
    });
};