//includereplace is used to build preview pages
module.exports = {
    build: {
        options: {
            prefix: '<!-- @@',
            suffix: ' -->'
        },
        src: 'src/build/vizabi-amd.frag',
        dest: 'src/vizabi-amd.js'
    },
    //build preview_pages without require
    preview_pages_build: {
        options: {
            prefix: '<!-- @@',
            suffix: ' -->',
            globals: {
                include_require: ''
            }
        },
        src: 'preview_pages/**/*.html',
        dest: 'preview/'
    },
    //build preview_pages with require
    preview_pages_dev: {
        options: {
            prefix: '<!-- @@',
            suffix: ' -->',
            globals: {
                include_require: '<script data-main="../../config.js" src="../../../lib/requirejs/require.js"></script>'
            }
        },
        src: 'preview_pages/**/*.html',
        dest: 'preview/'
    }
};