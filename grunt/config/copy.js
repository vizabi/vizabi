// Copy all js and template files to preview folder
module.exports = {
    preview_pages: {
        files: [{
                cwd: 'preview_pages',
                src: ['assets/scripts.js', 'assets/style.css'],
                dest: 'preview/preview_pages/',
                expand: true
            },
            //jquery used only for testing and preview page
            {
                cwd: 'lib/jquery/dist/',
                src: ['jquery.min.js', 'jquery.min.map'],
                dest: 'preview/preview_pages/assets/',
                expand: true
            },
            //font awesome used only for preview page
            {
                cwd: 'lib/font-awesome/',
                src: ['css/font-awesome.min.css', 'fonts/*'],
                dest: 'preview/preview_pages/assets/font-awesome/',
                expand: true
            }
        ]
    },
    local_data: {
        cwd: 'local_data',
        src: ['**/*'],
        dest: 'preview/local_data/',
        expand: true
    },
    assets: {
        cwd: 'src',
        src: ['assets/imgs/**/*'],
        dest: 'preview/',
        expand: true
    },
    scripts: {
        cwd: 'src',
        src: ['**/*.js'],
        dest: 'preview/',
        expand: true
    },
    templates: {
        cwd: 'src',
        src: ['**/*.html'],
        dest: 'preview/',
        expand: true
    },
    /*
     * copy test files to preview to be able to rerun on stage
     * this is a very specific task aimed on replaying
     * a preview version of spec tests only
     */
    test: {
        files: [{
            cwd: '.grunt/grunt-contrib-jasmine/',
            src: ['**/*'],
            dest: 'preview/test/jasmine/',
            expand: true
        }, {
            cwd: 'spec/',
            src: ['**/*'],
            dest: 'preview/test/spec/',
            expand: true
        }]
    },
    /*
     * copy files from build to dist
     */
    dist: {
        cwd: 'preview',
        src: ['vizabi.js', 'vizabi.css'],
        dest: 'dist/',
        expand: true
    }
};