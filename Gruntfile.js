module.exports = function(grunt) {

    /* 
     * load all grunt tasks, instead of loading each one like this:
     * grunt.loadNpmTasks('grunt-concurrent'); ...
     * This reads the file package.json
     * More info here: https://github.com/sindresorhus/load-grunt-tasks
     */
    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*', '@*/grunt-*', '!grunt-template-jasmine-requirejs']
    });

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
        'build', //by default, just build and test
        'test:copy',
        'jasmine:prod',
        // 'removelogging', //removes console.log
        'copy:dist' //copies dist files
    ]);

    //build and deploy
    grunt.registerTask('build-deploy', [
        'default',
        'deploy'
    ]);

    //testing
    grunt.registerTask('test', function() {
        grunt.task.run([
            'build',
            'jasmine:prod'
        ]);
    });

    grunt.registerTask('test:dev', function() {
        grunt.option('force', true);
        grunt.task.run([
            'dev-preview',
            'jasmine:dev:build',
            'connect:test', //run locally
        ]);
    });

    grunt.registerTask('test:copy', [
        'jasmine:prod:build',
        'copy:test',
        'replace:test',
    ]);

    //developer task: grunt dev
    grunt.registerTask('dev-preview', [
        'clean:preview', //clean preview folder
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
        'jshint:all'
    ]);

    //build task: grunt build
    grunt.registerTask('build', [
        'clean', //clean preview and dist folder
        'includereplace:build', //build AMD wrapper
        'write_plugins', //includes all tools and components in plugins.js
        'requirejs:preview', //use requirejs for amd module
        'generate_styles', //generate scss
        'sass:preview', //compile scss
        'preview_pages_menu', //build preview_pages menu template
        'includereplace:preview_pages_build', //preview_pages folder
        'preview_pages_index', //build preview_pages
        'copy:preview_pages', //copies preview_page assets
        'copy:local_data', //copies local_data
        'copy:assets', //copies assets
    ]);

    //developer task: grunt dev
    grunt.registerTask('dev', [
        'dev-preview', //copies source to preview
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);

    //default task with connect
    grunt.registerTask('serve', [
        'default', //default build
        'connect:dev', //run locally
        'watch' //watch for code changes
    ]);

    //deploy preview folder to s3
    grunt.registerTask('deploy', [
        'gitinfo',
        'aws_s3'
    ]);

    /* 
     * -----------------------------
     * Configuration:
     */

    grunt.initConfig({

        // Clean preview and dist folders to have a clean start
        clean: {
            preview: ["preview/*"],
            dist: ["dist/*"]
        },

        //gitinfo task
        gitinfo: {},

        // Copy all js and template files to preview folder
        copy: {
            preview_pages: {
                files: [{
                        cwd: 'preview_pages',
                        src: ['assets/scripts.js', 'assets/style.css'],
                        dest: 'preview/preview_pages/',
                        expand: true
                    },
                    //jquery used only for testing and preview page
                    {
                        cwd: 'lib/jquery/dist/',
                        src: ['jquery.min.js', 'jquery.min.map'],
                        dest: 'preview/preview_pages/assets/',
                        expand: true
                    },
                    //font awesome used only for preview page
                    {
                        cwd: 'lib/font-awesome/',
                        src: ['css/font-awesome.min.css', 'fonts/*'],
                        dest: 'preview/preview_pages/assets/font-awesome/',
                        expand: true
                    }
                ]
            },
            local_data: {
                cwd: 'local_data',
                src: ['**/*'],
                dest: 'preview/local_data/',
                expand: true
            },
            assets: {
                cwd: 'src',
                src: ['assets/imgs/**/*'],
                dest: 'preview/',
                expand: true
            },
            scripts: {
                cwd: 'src',
                src: ['**/*.js'],
                dest: 'preview/',
                expand: true
            },
            templates: {
                cwd: 'src',
                src: ['**/*.html'],
                dest: 'preview/',
                expand: true
            },
            /*
             * copy test files to preview to be able to rerun on stage
             * this is a very specific task aimed on replaying
             * a preview version of spec tests only
             */
            test: {
                files: [{
                    cwd: '.grunt/grunt-contrib-jasmine/',
                    src: ['**/*'],
                    dest: 'preview/test/jasmine/',
                    expand: true
                }, {
                    cwd: 'spec/',
                    src: ['**/*'],
                    dest: 'preview/test/spec/',
                    expand: true
                }]
            },
            /*
             * copy files from build to dist
             */
            dist: {
                cwd: 'preview',
                src: ['vizabi.js', 'vizabi.css'],
                dest: 'dist/',
                expand: true
            }
        },

        // Uglifying JS files
        uglify: {
            files: {
                cwd: 'src/', // base path
                src: '**/*.js', // source files mask
                dest: 'preview', // destination folder
                expand: true, // allow dynamic building
                mangle: false, // disallow change in names
                flatten: false // remove all unnecessary nesting
            }
        },

        // Compile SCSS files into CSS (dev mode is not compressed)
        sass: {
            preview: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'preview/vizabi.css': 'src/assets/style/vizabi.scss',
                }
            },
            dev: {
                options: {
                    style: 'expanded'
                },
                files: {
                    'preview/vizabi.css': 'src/assets/style/vizabi.scss',
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
            }
        },

        connect: {
            test: {
                options: {
                    port: 8000,
                    keepalive: true,
                    hostname: 'localhost',
                    livereload: 35728,
                    open: 'http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/test.html'
                }
            },
            dev: {
                options: {
                    port: 9000,
                    livereload: 35729,
                    hostname: 'localhost',
                    open: 'http://<%= connect.dev.options.hostname %>:<%= connect.dev.options.port %>/preview/preview_pages/'
                }
            },
        },

        requirejs: {
            // Options: https://github.com/jrburke/r.js/blob/master/build/preview_page.build.js
            preview: {
                options: {
                    baseUrl: "src/",
                    mainConfigFile: "src/config.js",
                    out: "preview/vizabi.js",
                    optimize: "uglify",
                    generateSourceMaps: false,
                }
            },

            pretty: {
                options: {
                    baseUrl: "src/",
                    mainConfigFile: "src/config.js",
                    out: "preview/vizabi.js",
                    generateSourceMaps: false,
                }
            }
        },

        replace: {
            test: {
                options: {
                    patterns: [{
                        match: /.grunt\/grunt-contrib-jasmine\//g,
                        replacement: 'test/jasmine/'
                    }, {
                        match: /spec\//g,
                        replacement: 'test/spec/'
                    }, {
                        match: /preview\//g,
                        replacement: ''
                    }]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['test.html'],
                    dest: 'preview/'
                }]
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
                dest: 'preview/'
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
                dest: 'preview/'
            }
        },

        //run tests
        jasmine: {
            dev: {
                src: 'preview/vizabi.js',
                options: {
                    outfile: 'test.html',
                    keepRunner: true,
                    specs: 'spec/**/*-spec.js',
                    helpers: 'spec/**/*-helper.js',
                    host: 'http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/',
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        requireConfigFile: 'preview/config.js',
                        requireConfig: {
                            baseUrl: 'preview/'
                        }
                    },
                    styles: ['preview/vizabi.css', 'spec/spec.css'],
                    vendor: ['preview/preview_pages/assets/jquery.min.js']
                }
            },
            prod: {
                src: 'preview/vizabi.js',
                options: {
                    outfile: 'test.html',
                    specs: 'spec/**/*-spec.js',
                    helpers: 'spec/**/*-helper.js',
                    styles: ['preview/vizabi.css', 'spec/spec.css'],
                    vendor: ['preview/preview_pages/assets/jquery.min.js'],
                    page: {
                        //laptopsize
                        viewportSize: {
                            width: 1280,
                            height: 768
                        }
                    }
                }
            }
        },

        //removes console.log from output file
        removelogging: {
            preview: {
                src: "preview/vizabi.js",
                options: {
                    methods: ['log'] //only log
                }
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
                    cwd: 'preview/',
                    src: ['**'],
                    dest: aws.AWS_SUBFOLDER + '/<%= (process.env.TRAVIS_BRANCH || gitinfo.local.branch.current.name) %>/'
                }]
            }
        },

        //code quality, js hint
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                force: true //todo: remove force
            },
            all: ['Gruntfile.js', 'src/**/*.js', 'spec/**/*.js'],
            dev: ['src/**/*.js'],
            spec: ['spec/**/*.js']
        }

    });

    /*
     * ---------
     * Building custom preview_page index
     */

    grunt.registerTask('preview_pages_index', 'Writes preview_pages index', function() {

        var preview_pages_folder = 'preview/preview_pages/',
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
        }

        grunt.file.write(scss_file, contents);

        grunt.log.writeln("All styles included in vizabi.scss");
    });
};