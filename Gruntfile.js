module.exports = function(grunt) {

    /* 
     * load all grunt tasks, instead of loading each one like this:
     * grunt.loadNpmTasks('grunt-concurrent'); ...
     * This reads the file package.json
     * More info here: https://github.com/sindresorhus/load-grunt-tasks
     */
    require('load-grunt-tasks')(grunt);

    /* 
     * -----------------------------
     * Tasks:
     */

    //default task: grunt
    grunt.registerTask('default', [
        'build' //by default, just build
    ]);

    //build task: grunt
    // grunt.registerTask('build', [
    //     'clean:dist', //clean dist folder
    //     'copy:templates', //copy js and template files
    //     'uglify', //uglify js files
    //     'sass:dist', //compile scss
    //     'examples', //build examples
    // ]);

    //developer task: grunt dev
    grunt.registerTask('dev', [

        'clean:dist', //clean dist folder
        'write_plugins', //includes all tools and components in plugins.js
        'requirejs:dev', //concatenate all in one file
        'sass:dev', //compile scss
        'sass:dev', //compile scss
        'examples_menu', //build examples menu template
        'includereplace:examples', //examples folder
        'examples_index', //build examples
        'copy:scripts',
        'copy:templates',
        'copy:examples', //copies example assets
        'copy:waffles', //copies waffles
        'copy:assets', //copies assets
        'connect', //run locally
        'watch' //watch for code changes
    ]);

    //developer task: grunt dev
    grunt.registerTask('build', [

        'clean:dist', //clean dist folder
        'write_plugins', //includes all tools and components in plugins.js
        'requirejs:dist', //use requirejs for amd module
        'sass:dist', //compile scss
        'examples_menu', //build examples menu template
        'includereplace:examples', //examples folder
        'examples_index', //build examples
        'copy:examples', //copies example assets
        'copy:waffles', //copies waffles
        'copy:assets', //copies assets

    ]);

    //default task with connect
    grunt.registerTask('serve', [
        'default', //default build
        'connect', //run locally
        'watch' //watch for code changes
    ]);

    /* 
     * -----------------------------
     * Configuration:
     */

    grunt.initConfig({

        // Clean dist folder to have a clean start
        clean: {
            dist: ["dist/*"]
        },

        // Copy all js and template files to dist folder
        copy: {
            examples: {
                cwd: 'examples',
                src: ['assets/scripts.js', 'assets/style.css'],
                dest: 'dist/examples/',
                expand: true
            },
            waffles: {
                cwd: 'data-waffles',
                src: ['**/*'],
                dest: 'dist/data-waffles/',
                expand: true
            },
            assets: {
                cwd: 'src',
                src: ['assets/imgs/**/*'],
                dest: 'dist/',
                expand: true
            },
            scripts: {
                cwd: 'src',
                src: ['**/*.js'],
                dest: 'dist/',
                expand: true
            },
            templates: {
                cwd: 'src',
                src: ['**/*.html'],
                dest: 'dist/',
                expand: true
            }
        },

        // Uglifying JS files
        uglify: {
            files: {
                cwd: 'src/', // base path
                src: '**/*.js', // source files mask
                dest: 'dist', // destination folder
                expand: true, // allow dynamic building
                mangle: false, // disallow change in names
                flatten: false // remove all unnecessary nesting
            }
        },

        // Compile SCSS files into CSS (dev mode is not compressed)
        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'dist/vizabi.css': 'src/assets/style/vizabi.scss',
                }
            },
            dev: {
                options: {
                    style: 'expanded'
                },
                files: {
                    'dist/vizabi.css': 'src/assets/style/vizabi.scss',
                }
            }
        },

        // Make sure necessary files are built when changes are made
        watch: {
            styles: {
                files: ['src/**/*.scss'],
                tasks: ['sass:dev']
            },
            examples: {
                files: ['examples/**/*.html', '!examples/index.html'],
                tasks: ['includereplace:examples', 'examples_index', 'copy:examples']
            },
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['copy:scripts', 'copy:templates']
            },
            options: {
                livereload: {
                    port: '<%= connect.options.livereload %>'
                }
            }
        },

        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/dist/examples/'
                }
            }
        },

        requirejs: {
            // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
            dist: {
                options: {
                    baseUrl: "src/",
                    mainConfigFile: "src/config.js",
                    out: "dist/vizabi.js",
                    optimize: "uglify",
                    generateSourceMaps: false,
                }
            },
            dev: {
                options: {
                    baseUrl: "src/",
                    mainConfigFile: "src/config.js",
                    out: "dist/vizabi.js",
                    optimize: "none",
                    generateSourceMaps: true
                }
            }
        },

        includereplace: {
            examples: {
                options: {
                    prefix: '<!-- @@',
                    suffix: ' -->'
                },
                src: 'examples/**/*.html',
                dest: 'dist/'
            }
        }
    });

    /*
     * ---------
     * Building custom example index
     */

    grunt.registerTask('examples_index', 'Writes example index', function() {

        var examples_folder = 'dist/examples/',
            examples_index = examples_folder + 'index.html',
            contents = "<h1>Vizabi Examples:</h1>",
            current_dir;

        grunt.file.recurse(examples_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.html') !== -1) {
                if (current_dir !== dir) {
                    current_dir = dir;
                    contents += "<h2>" + dir + "</h2>";
                }
                var link = dir + '/' + file;
                var example = "<p><a href='" + link + "'>" + file + "</a></p>";
                contents += example;
            }
        });
        grunt.file.write(examples_index, contents);
        grunt.log.writeln("Wrote examples index.");
    });

    grunt.registerTask('examples_menu', 'Writes _examples.tpl', function() {

        var examples_folder = 'examples/',
            examples_file = examples_folder + 'assets/_examples.tpl',
            current_dir,
            contents = "";

        grunt.file.recurse(examples_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.html') !== -1) {
                file = file.replace(".html", "");
                var link = dir + '/' + file;
                var example = "<li><a onclick=\"goToExample('"+link+"');\">"+link+"</a></li>";
                contents += example;
            }
        });
        grunt.file.write(examples_file, contents);
        grunt.log.writeln("Wrote examples menu template.");
    });

    /*
     * ---------
     * Hotfix to include everything into the AMD
     * Include every tool and component into src/plugins.js
     */

    grunt.registerTask('write_plugins', 'Includes every component and tool into the AMD module', function() {

        var tools_folder = 'src/tools/',
            components_folder = 'src/components/',
            plugins_file = 'src/plugins.js',
            contents = [],
            current_dir;

        grunt.file.recurse(tools_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.js') !== -1) {
                contents.push('"tools/' + dir + '/' + dir+'"');
            }
            else if (typeof dir !== 'undefined' && file.indexOf('.html') !== -1) {
                contents.push('"text!tools/' + dir + '/' + file+'"');
            }
        });

        grunt.file.recurse(components_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.js') !== -1) {
                contents.push('"components/' + dir + '/' + dir+'"');
            }
            else if (typeof dir !== 'undefined' && file.indexOf('.html') !== -1) {
                contents.push('"text!components/' + dir + '/' + file+'"');
            }
        });

        contents = 'define([' + contents.join(",") + '], function() {});';
        grunt.file.write(plugins_file, contents);

        grunt.log.writeln("All tools and components have been included in the AMD module.");
    });


}