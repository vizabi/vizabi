module.exports = function (grunt) {
  
  grunt.initConfig({

    clean: {
      dist: ['dist']
    },

    connect: {
      dev: {
        options: {
          port: 9000,
          base: 'dist',
          hostname: 'localhost',
          open: 'http://<%= connect.dev.options.hostname %>:<%= connect.dev.options.port %>/'
        }
      }
    },

    copy: {
      vendor: {
          cwd: 'bower_components/',
          src: ['angular/angular.min.js', 'd3/d3.min.js'],
          dest: 'dist/vendor/',
          expand: true
      },
      images: {
          cwd: 'src/',
          src: ['public/**/*'],
          dest: 'dist/',
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
          "dist/index.html": ["src/index.jade"]
        }
      }
    },

    //unit tests
    jasmine: {
      src: 'dist/scripts/app.js',
      options: {
          specs: 'test/unit/*.js',
          vendor: ['dist/vendor/angular.min.js', 'bower_components/angular-mocks/angular-mocks.js']
      }
    },
    
    //code style
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
          reporter: require('jshint-stylish')
      }
    },

    sass: {
        dist: {
            files: {
                'dist/styles/main.css': 'src/styles/main.scss'
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
          'dist/scripts/app.js': ['src/js/app.js', 'src/**/*.js']
        }
      }
    },

    watch: {
      scripts: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'uglify'/*, 'jasmine'*/]
      },
      jade: {
        files: ['src/**/*.jade'],
        tasks: ['jade']
      },
      styles: {
        files: ['src/styles/**/*.scss'],
        tasks: ['sass']
      },
      tests: {
        files: ['test/unit/**/*.js'],
        tasks: ['jasmine']
      }
    }

  });

  //load all grunt packages in package.json
  require('load-grunt-tasks')(grunt);

  //main grunt tasks
  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('build', ['clean', 'copy', 'jade', 'uglify', 'sass'/*, 'test'*/]);
  grunt.registerTask('serve', ['jshint', 'build', 'connect', 'watch']);
  grunt.registerTask('default', ['build']);

};

