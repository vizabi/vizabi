// Make sure necessary files are built when changes are made
module.exports = {
    styles: {
        files: ['src/**/*.scss', 'preview_src/assets/**/*.scss'],
        tasks: ['sass:dev']
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
    },
    preview: {
        files: ['preview_src/**/*'], //['src/**/*.js', 'specs/**/*.js'],
        tasks: ['preview']
    }
};