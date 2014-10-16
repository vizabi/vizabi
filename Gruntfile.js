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
    //     'preview_pages', //build preview_pages
    // ]);

    //developer task: grunt dev
    grunt.registerTask('dev', [

        'clean:dist', //clean dist folder
        'write_plugins', //includes all tools and components in plugins.js
        'generate_styles', //generate scss
        'sass:dev', //compile scss
        'preview_pages_menu', //build preview_pages menu template
        'includereplace:preview_pages_dev', //preview_pages folder
        'preview_pages_index', //build preview_pages
        'copy:scripts',
        'copy:templates',
        'copy:preview_pages', //copies preview_page assets
        'copy:waffles', //copies waffles
        'copy:assets', //copies assets
        'connect', //run locally
        'watch' //watch for code changes
    ]);

    //developer task: grunt dev
    grunt.registerTask('build', [

        'clean:dist', //clean dist folder
        'includereplace:build', //build AMD wrapper
        'write_plugins', //includes all tools and components in plugins.js
        'requirejs:dist', //use requirejs for amd module
        'generate_styles', //generate scss
        'sass:dist', //compile scss
        'preview_pages_menu', //build preview_pages menu template
        'includereplace:preview_pages_build', //preview_pages folder
        'preview_pages_index', //build preview_pages
        'copy:preview_pages', //copies preview_page assets
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
            preview_pages: {
                cwd: 'preview_pages',
                src: ['assets/scripts.js', 'assets/style.css'],
                dest: 'dist/preview_pages/',
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
            preview_pages: {
                files: ['preview_pages/**/*.html', '!preview_pages/index.html'],
                tasks: ['includereplace:preview_pages_dev', 'preview_pages_index', 'copy:preview_pages']
            },
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['copy:scripts', 'copy:templates']
            },
            templates: {
                files: ['src/**/*.html'],
                tasks: ['copy:templates']
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
                    open: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/dist/preview_pages/'
                }
            }
        },

        requirejs: {
            // Options: https://github.com/jrburke/r.js/blob/master/build/preview_page.build.js
            dist: {
                options: {
                    baseUrl: "src/",
                    mainConfigFile: "src/config.js",
                    out: "dist/vizabi.js",
                    optimize: "uglify",
                    generateSourceMaps: false,
                }
            }
        },

        includereplace: {
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
                dest: 'dist/'
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
                dest: 'dist/'
            }
        }
    });

    /*
     * ---------
     * Building custom preview_page index
     */

    grunt.registerTask('preview_pages_index', 'Writes preview_pages index', function() {

        var preview_pages_folder = 'dist/preview_pages/',
            preview_pages_index = preview_pages_folder + 'index.html',
            contents = "<h1>Vizabi Examples:</h1>",
            current_dir;

        grunt.file.recurse(preview_pages_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.html') !== -1) {
                if (current_dir !== dir) {
                    current_dir = dir;
                    contents += "<h2>" + dir + "</h2>";
                }
                var link = dir + '/' + file;
                var preview_page = "<p><a href='" + link + "'>" + file + "</a></p>";
                contents += preview_page;
            }
        });
        grunt.file.write(preview_pages_index, contents);
        grunt.log.writeln("Wrote preview_pages index.");
    });

    grunt.registerTask('preview_pages_menu', 'Writes _preview_pages.tpl', function() {

        var preview_pages_folder = 'preview_pages/',
            preview_pages_file = preview_pages_folder + 'assets/_preview.tpl',
            current_dir,
            contents = "";

        grunt.file.recurse(preview_pages_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.html') !== -1) {
                file = file.replace(".html", "");
                var link = dir + '/' + file;
                var preview_page = "<li><a onclick=\"goToExample('" + link + "');\">" + link + "</a></li>";
                contents += preview_page;
            }
        });
        grunt.file.write(preview_pages_file, contents);
        grunt.log.writeln("Wrote preview_pages menu template.");
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
            var clean_abs;
            if (typeof dir !== 'undefined' && /\.js$/.test(file)) {
                // src/tools/_examples/bar-chart/bar-chart.js --> tools/_examples/bar-chart/bar-chart 
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            } else if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                clean_abs = abs.replace("src/", "");
                contents.push('"text!' + clean_abs + '"');
            }
        });

        grunt.file.recurse(components_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (typeof dir !== 'undefined' && /\.js$/.test(file)) {
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            } else if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                clean_abs = abs.replace("src/", "");
                contents.push('"text!' + clean_abs + '"');
            }
        });

        contents = 'define([' + contents.join(",") + '], function() {});';
        grunt.file.write(plugins_file, contents);

        grunt.log.writeln("All tools and components have been included in the AMD module.");
    });

    /*
     * ---------
     * Include all tool styles into vizabi.scss
     */

    grunt.registerTask('generate_styles', 'Adds each tool scss to vizabi.scss', function() {

        var tools_folder = 'src/tools/',
            scss_file = 'src/assets/style/vizabi.scss',
            includes = ['_vizabi.scss'],
            contents = '',
            current_dir;

        grunt.file.recurse(tools_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && file.indexOf('.scss') !== -1) {
                var clean_abs = abs.replace("src/", "");
                includes.push('../../' + clean_abs);
            }
        });

        for (var i = 0; i < includes.length; i++) {
            contents += '@import "' + includes[i] + '";\n';
        };

        grunt.file.write(scss_file, contents);

        grunt.log.writeln("All styles included in vizabi.scss");
    });


}