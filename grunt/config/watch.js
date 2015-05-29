// Make sure necessary files are built when changes are made
module.exports = {
    options: {
        livereload: {
            port: '<%= connect.dev.options.livereload %>'
        }
    },
    styles: {
        files: ['src/**/*.scss', 'preview_src/assets/**/*.scss'],
        tasks: ['sass:dev']
    },
    scripts: {
        files: ['src/**/*.js'],
        tasks: ['concat']
    },
    test: {
        files: ['spec/**/*.js'], //['src/**/*.js', 'specs/**/*.js'],
        tasks: ['jasmine']
    },
    preview: {
        files: ['preview_src/**/*'], //['src/**/*.js', 'specs/**/*.js'],
        tasks: ['sass:preview','copy:preview','assemble:prod']
    }
};