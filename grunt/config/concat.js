//concat config
module.exports = function(grunt) {

    var custom = grunt.option('custom');

    var FILES = {
        base: ['src/vizabi.js',
            'src/base/utils.js',
            'src/base/promise.js',
            'src/base/class.js',
            'src/base/data.js',
            'src/base/events.js',
            'src/base/intervals.js',
            'src/base/layout.js',
            'src/base/model.js',
            'src/base/component.js',
            'src/base/tool.js'
        ],
        components: ['.tmp/templates.js',
            'src/components/**/*.js'
        ],
        models: ['src/models/**/*.js'],
        tools: ['src/tools/**/*.js'],
        readers: ['src/readers/**/*.js'],
        plugins: ['src/plugins/**/*.js'],
        templates: ['src/components/**/*.html','src/tools/**/*.html'],
        custom: ['src/vizabi_prefs/'+custom+'.js']
    }

    var FILES_COMPONENTS = ['.tmp/templates.js',
        'src/components/_gapminder/timeslider/*.js'
    ];

    var BUILD_FILES = ([]).concat(FILES.base)
                     .concat(FILES.components)
                     .concat(FILES.models)
                     .concat(FILES.readers)
                     .concat(FILES.tools)
                     .concat(FILES.plugins);

    if(custom) {
        BUILD_FILES = BUILD_FILES.concat(FILES.custom);
    }

    return {
        options: {
            stripBanners: true,
            banner: '/* VIZABI - http://www.gapminder.org - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
        },

        templates: {
            options: {
                process: function(src, filepath) {
                    var content = src.replace(/'/g, '\"')
                        .replace(/(\r\n|\n|\r)/gm, " ")
                        .replace(/\s+/g, " ")
                        .replace(/<!--[\s\S]*?-->/g, "");
                    return "(function() {" +
                        "var root = this;" +
                        "var s = root.document.createElement('script');" +
                        "s.type = 'text/template';" +
                        "s.setAttribute('id', '" + filepath + "');" +
                        "s.innerHTML = '" + content + "';" +
                        "root.document.body.appendChild(s);" +
                        "}).call(this);";
                }
            },
            src: FILES.templates,
            dest: '.tmp/templates.js',
        },

        full: {
            options: {
                sourceMap: true
            },
            src: BUILD_FILES,
            dest: 'dist/vizabi.js',
        }
    };
};