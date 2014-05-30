module.exports = function (grunt) {
    grunt.initConfig({
      sass: {
        dist: {
          options: {
            style: 'expanded'
          },
          files: {
            'visualizations/vizabi.css': 'visualizations/vizabi.scss',
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');

    grunt.registerTask('default', ['sass']);
}
