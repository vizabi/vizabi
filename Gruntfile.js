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
     * Deployment keys
     */

    var aws = {};
    try {
        aws = grunt.file.readJSON('.deploy-keys.json');
    } catch (err) {
        aws = {
            "AWS_ACCESS_KEY_ID": process.env.AWS_ACCESS_KEY_ID,
            "AWS_SECRET_KEY": process.env.AWS_SECRET_KEY,
            "AWS_BUCKET": process.env.AWS_BUCKET || 'static.gapminder.org',
            "AWS_SUBFOLDER": process.env.AWS_SUBFOLDER || 'vizabi'
        };
    }

    /* 
     * -----------------------------
     * Tasks:
     */

    //default task: grunt
    grunt.registerTask('default', [
        'build' //by default, just build
    ]);

    //build and deploy
    grunt.registerTask('build-deploy', [
        'build',
        'deploy'
    ]);

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
        'copy:local_data', //copies local_data
        'copy:assets', //copies assets
        'copy:fonts', //copies fonts (font awesome)
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
        'copy:local_data', //copies local_data
        'copy:assets', //copies assets
        'copy:fonts', //copies fonts (font awesome)

    ]);

    //default task with connect
    grunt.registerTask('serve', [
        'default', //default build
        'connect', //run locally
        'watch' //watch for code changes
    ]);

    //deploy dist folder to s3
    grunt.registerTask('deploy', [
        'gitinfo',
        'aws_s3'
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

        //gitinfo task
        gitinfo: {},

        // Copy all js and template files to dist folder
        copy: {
            preview_pages: {
                cwd: 'preview_pages',
                src: ['assets/scripts.js', 'assets/style.css'],
                dest: 'dist/preview_pages/',
                expand: true
            },
            local_data: {
                cwd: 'local_data',
                src: ['**/*'],
                dest: 'dist/local_data/',
                expand: true
            },
            assets: {
                cwd: 'src',
                src: ['assets/imgs/**/*'],
                dest: 'dist/',
                expand: true
            },
            fonts: {
                cwd: 'lib/font-awesome',
                src: ['fonts/*'],
                dest: 'dist/assets/',
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
                files: ['src/**/*.scss', 'preview_pages/assets/*.scss'],
                tasks: ['sass:dev']
            },
            preview_pages: {
                files: ['preview_pages/**/*.html', '!preview_pages/index.html', 'preview_pages/assets/scripts.js', 'preview_pages/assets/style.css'],
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
        },

        //upload to s3 task
        aws_s3: {
            options: {
                accessKeyId: aws.AWS_ACCESS_KEY_ID,
                secretAccessKey: aws.AWS_SECRET_KEY,
                region: 'eu-west-1'
            },
            staging: {
                options: {
                    bucket: aws.AWS_BUCKET
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: aws.AWS_SUBFOLDER + '/<%= (process.env.TRAVIS_BRANCH || gitinfo.local.branch.current.name) %>/'
                }]
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
            contents = '<link rel="stylesheet" href="assets/style.css">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' +
            '<div class="index"><h1>Vizabi Preview Pages:</h1>',
            current_dir;

        grunt.file.recurse(preview_pages_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                if (current_dir !== dir) {
                    current_dir = dir;
                    contents += "<h2>" + dir + "</h2>";
                }
                var link = dir + '/' + file;
                var preview_page = "<p><a href='" + link + "'>" + file + "</a></p>";
                contents += preview_page;
            }
        });
        contents += "</div>";
        grunt.file.write(preview_pages_index, contents);
        grunt.log.writeln("Wrote preview_pages index.");
    });

    grunt.registerTask('preview_pages_menu', 'Writes _preview_pages.tpl', function() {

        var preview_pages_folder = 'preview_pages/',
            preview_pages_file = preview_pages_folder + 'assets/_preview.tpl',
            current_dir,
            contents = "";

        grunt.file.recurse(preview_pages_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
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
     * //TODO: Improve this task
     * Hotfix to include everything into the AMD
     * Include every tool and component into src/plugins.js
     */

    grunt.registerTask('write_plugins', 'Includes every component and tool into the AMD module', function() {

        var tools_folder = 'src/tools/',
            components_folder = 'src/components/',
            models_folder = 'src/models/',
            readers_folder = 'src/readers/',
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

        grunt.file.recurse(models_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (/\.js$/.test(file)) {
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            }
        });

        grunt.file.recurse(readers_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (/\.js$/.test(file)) {
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            }
        });

        //hotfix all files in global variable AS WELL
        contents = 'var _vzb_available_plugins=[' + contents.join(",") + ']; define([' + contents.join(",") + '], function() {});';
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
            includes = ['_vizabi.scss', '../../tools/_tool.scss'],
            contents = '',
            current_dir;

        grunt.file.recurse(tools_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && /\.scss$/.test(file)) {
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
