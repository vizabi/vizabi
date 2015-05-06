//code quality, js hint
module.exports = {
    options: {
        reporter: require('jshint-stylish'),
        force: true //todo: remove force
    },
    all: ['Gruntfile.js', 'grunt/**/*.js', 'src/**/*.js', 'spec/**/*.js'],
    dev: ['src/**/*.js'],
    spec: ['spec/**/*.js']
};