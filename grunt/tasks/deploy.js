//deploy preview folder to s3
module.exports = function(grunt) {
    grunt.registerTask('deploy', [
        'gitinfo',
        'aws_s3'
    ]);
};