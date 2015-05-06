//upload to s3 task
module.exports = {
    options: {
        accessKeyId: '<%= AWS_ACCESS_KEY_ID %>',
        secretAccessKey: '<%= AWS_SECRET_KEY %>',
        region: '<%= AWS_REGION %>'
    },
    staging: {
        options: {
            bucket: '<%= AWS_BUCKET %>'
        },
        files: [{
            expand: true,
            cwd: 'preview/',
            src: ['**'],
            dest: <%= AWS_SUBFOLDER %> + '/<%= (process.env.TRAVIS_BRANCH || gitinfo.local.branch.current.name) %>/'
        }]
    }
};