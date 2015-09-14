module.exports = function (grunt) {
  
  grunt.initConfig({

    clean: {
      dist: ['client/dist']
    },

    copy: {
      vendor: {
          cwd: 'bower_components/',
          src: ['angular/angular.min.js', 'angular-ui-router/release/angular-ui-router.min.js', 'd3/d3.min.js'],
          dest: 'client/dist/vendor/',
          expand: true
      },
      images: {
          cwd: 'client/src/',
          src: ['public/**/*'],
          dest: 'client/dist/',
          expand: true
      }
    },

    jade: {
      compile: {
        options: {
          data: {
            debug: false
          }
        },
        files: {
          "client/dist/index.html": ["client/src/index.jade"]
        }
      }
    },

    //code style
    jshint: {
      files: ['Gruntfile.js', 'client/src/**/*.js'],
      options: {
          reporter: require('jshint-stylish')
      }
    },

    sass: {
        dist: {
            files: {
                'client/dist/styles/main.css': 'client/src/styles/main.scss'
            }
        }
    },

    uglify: {
      dist: {
        options: {
          sourceMap: true,
          mangle: true
        },
        files: {
          'client/dist/scripts/app.js': ['client/src/js/app.js', 'client/src/**/*.js']
        }
      }
    },

    watch: {
      scripts: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'uglify']
      },
      jade: {
        files: ['client/src/**/*.jade'],
        tasks: ['jade']
      },
      styles: {
        files: ['client/src/styles/**/*.scss'],
        tasks: ['sass']
      }
    }

  });

  //load all grunt packages in package.json
  require('load-grunt-tasks')(grunt);

  //main grunt tasks
  grunt.registerTask('build', ['clean', 'copy', 'jade', 'uglify', 'sass']);
  grunt.registerTask('dev', ['build', 'watch']);
  grunt.registerTask('default', ['build']);

};

