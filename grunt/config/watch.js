// Make sure necessary files are built when changes are made
module.exports = {
    styles: {
        files: ['src/**/*.scss', 'preview_pages/assets/*.scss'],
        tasks: ['sass:dev']
    },
    preview_pages: {
        files: ['preview_pages/**/*.html', '!preview_pages/index.html', 'preview_pages/assets/scripts.js', 'preview_pages/assets/style.css'],
        tasks: ['includereplace:preview_pages_dev', 'preview_pages_index', 'copy:preview_pages']
    },
    scripts: {
        files: ['src/**/*.js'],
        tasks: ['copy:scripts', 'copy:templates', 'jshint:dev']
    },
    templates: {
        files: ['src/**/*.html'],
        tasks: ['copy:templates']
    },
    options: {
        livereload: {
            port: '<%= connect.dev.options.livereload %>'
        }
    },
    test: {
        files: ['spec/**/*.js'], //['src/**/*.js', 'specs/**/*.js'],
        tasks: ['jasmine:dev']
    }
};