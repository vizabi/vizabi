//concat config
module.exports = function(grunt) {

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
            'src/components/_gapminder/timeslider/*.js'
        ],
        models: ['src/models/entities.js',
            'src/models/time.js',
            'src/models/language.js'
        ],
        tools: ['src/tools/_examples/bar-chart/bar-chart.js'],
        readers: ['src/readers/**/*.js'],
        plugins: ['src/plugins/**/*.js'],
        templates: ['src/components/_gapminder/timeslider/*.html',
        'src/tools/_examples/bar-chart/**/*.html']
    }

    var FILES_COMPONENTS = ['.tmp/templates.js',
        'src/components/_gapminder/timeslider/*.js'
    ];

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

        base: {
            src: FILES.base,
            dest: 'dist/expanded/vizabi.base.js',
        },

        models: {
            //TODO: import all models
            //models
            src: FILES.models,
            dest: 'dist/expanded/vizabi.models.js',
        },

        components: {
            src: FILES.components,
            dest: 'dist/expanded/vizabi.components.js',
        },

        readers: {
            src: FILES.readers,
            dest: 'dist/expanded/vizabi.readers.js',
        },

        tools: {
            src: FILES.tools,
            dest: 'dist/expanded/vizabi.tools.js',
        },

        plugins: {
            src: FILES.plugins,
            dest: 'dist/expanded/vizabi.plugins.js',
        },

        full: {
            options: {
                sourceMap: true
            },
            src: ([]).concat(FILES.base)
                     .concat(FILES.components)
                     .concat(FILES.models)
                     .concat(FILES.readers)
                     .concat(FILES.tools)
                     .concat(FILES.plugins),
            dest: 'dist/vizabi.js',
        }
    };
};