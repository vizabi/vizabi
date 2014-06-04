

module.exports = function (grunt) {

    /* 
     * load all grunt tasks, instead of loading each one like this:
     * grunt.loadNpmTasks('grunt-concurrent'); ...
     * This reads the file package.json
     * More info here: https://github.com/sindresorhus/load-grunt-tasks
     */
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

      // Clean dist folder to have a clean start
      clean: {
          dist: ["dist"]
      },

      // Copy all js and template files to dist folder
      copy: {
            scripts: {
              cwd: 'src',
              src: ['**/*.js'],
              dest: 'dist',
              expand: true
            },
            templates: {
              cwd: 'src',
              src: ['**/*.html'],
              dest: 'dist',
              expand: true
            }            
          },
      },

      // Uglifying JS files
      uglify: {
        files: { 
            cwd: 'src/',          // base path
            src: '**/*.js',       // source files mask
            dest: 'dist',         // destination folder
            expand: true,         // allow dynamic building
            mangle: false,        // disallow change in names
            flatten: false        // remove all unnecessary nesting
        }
      },

      // Compile SCSS files into CSS (dev mode is not compressed)
      sass: {
        dist: {
          options: {
            style: 'compressed'
          },
          files: {
            'dist/vizabi.css': 'src/style/vizabi.scss',
          }
        },
        dev: {
          options: {
            style: 'expanded'
          },
          files: {
            'dist/vizabi.css': 'src/style/vizabi.scss',
          }
        }
      },

      // Make sure necessary files are built when changes are made
      watch: {
        styles: {
          files: ['src/**/*.scss'],
          tasks: ['sass:dev']
        }
      }
    });

    /* 
     * -----------------------------
     * Tasks:
     */

    //default task: grunt
    grunt.registerTask('default',[

      'clean:dist',   //clean dist folder
      'copy:templates',         //copy js and template files
      'uglify',       //uglify js files
      'sass:dist'     //compile scss

    ]);

    //developer task: grunt dev
    grunt.registerTask('dev', [

      'clean:dist',   //clean dist folder
      'copy',         //copy js and template files
      'sass:dev',     //compile scss
      'watch:styles'

    ]);


}
