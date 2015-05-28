//testing
module.exports = function(grunt) {
    grunt.registerTask('test', function() {
        grunt.task.run([
            'build',
            'jasmine'
        ]);
    });

    grunt.registerTask('test:dev', function() {
        grunt.option('force', true);
        grunt.task.run([
            'build',
            'jasmine',
            'connect:test', //run locally
        ]);
    });
};