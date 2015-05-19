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
                  'src/base/class.js',
                  'src/base/events.js',
                  'src/base/layout.js',
                  'src/base/component.js'],
            dest: 'dist/vizabi.js',
        }
    };
};