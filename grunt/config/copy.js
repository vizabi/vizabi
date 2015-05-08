// Copy all js and template files to preview folder
module.exports = {
    preview: {
        files: [{
                cwd: 'preview_src/',
                src: ['assets/css/**/*', 'assets/js/**/*'],
                dest: 'preview/',
                expand: true
            },
            //jquery used only for testing and preview page
            {
                cwd: 'lib/jquery/dist/',
                src: ['jquery.min.js', 'jquery.min.map'],
                dest: 'preview/assets/js/',
                expand: true
            },
            //font awesome used only for preview page
            {
                cwd: 'lib/font-awesome/',
                src: ['css/font-awesome.min.css', 'fonts/*'],
                dest: 'preview/assets/',
                expand: true
            }
        ]
    },
    preview_require: {
        //jquery used only for testing and preview page
        files: [{
            cwd: 'lib/requirejs/',
            src: ['require.js'],
            dest: 'preview/assets/js/',
            expand: true
        }]
    },
    local_data: {
        cwd: 'local_data',
        src: ['**/*'],
        dest: 'preview/local_data/',
        expand: true
    },
    //dev mode copy Javascript and 
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
    }
};