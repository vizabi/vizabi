//deploy preview folder to s3
module.exports = function(grunt) {
    grunt.registerTask('deploy', [
        'gitinfo',
        'compress',
        'aws_s3'
    ]);
};