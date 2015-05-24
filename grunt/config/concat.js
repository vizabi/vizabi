//concat config
module.exports = function(grunt) {
    return {
        options: {
            stripBanners: true,
            banner: '/*! VIZABI - http://www.gapminder.org - <%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        dist: {
            src: ['src/vizabi.js',
                'src/base/utils.js',
                'src/base/promise.js',
                'src/base/class.js',
                'src/base/data.js',
                'src/base/events.js',
                'src/base/intervals.js',
                'src/base/layout.js',
                'src/base/model.js',
                'src/base/component.js',
                'src/base/tool.js',
                //models
                'src/models/entities.js',
                'src/models/time.js'
            ],
            dest: 'dist/vizabi.js',
        }
    };
};