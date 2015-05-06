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
            'dev-preview',
            'jasmine:dev:build',
            'connect:test', //run locally
        ]);
    });

    grunt.registerTask('test:copy', [
        'jasmine:prod:build',
        'copy:test',
        'replace:test',
    ]);
};