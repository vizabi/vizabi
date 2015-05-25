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
            'src/models/time.js'
        ],
        templates: ['src/components/_gapminder/timeslider/*.html']
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
            //TODO: import all components
            //components
            src: FILES.components,
            dest: 'dist/expanded/vizabi.components.js',
        },

        full: {
            options: {
                sourceMap: true
            },
            src: ([]).concat(FILES.base)
                     .concat(FILES.components)
                     .concat(FILES.models),
            dest: 'dist/vizabi.js',
        }
    };
};