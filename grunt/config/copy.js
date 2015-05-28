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
                cwd: 'lib/d3/',
                src: ['d3.min.js'],
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
    
    local_data: {
        cwd: 'local_data',
        src: ['**/*'],
        dest: 'preview/local_data/',
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

    minified: {
        files: [{
            src: '.tmp/vizabi.js',
            dest: 'dist/vizabi.min.js'
        }]
    }
};