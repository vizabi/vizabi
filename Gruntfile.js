module.exports = function(grunt) {

    var path = require('path');

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
            "AWS_SUBFOLDER": process.env.AWS_SUBFOLDER || 'vizabi',
            "AWS_REGION": 'eu-west-1'
        };
    }

    /* 
     * load all grunt config, instead of loading each one like this:
     * grunt.loadNpmTasks('grunt-concurrent'); ...
     * This reads the file package.json provided the patterns
     */
    require('load-grunt-config')(grunt, {
        /* 
         * instead of grunt.initConfig({...}) we use configPath
         * files in the pattern grunt/config/<task>.js represent
         * grunt.initConfig({ <task>: {} ...)
         */
        configPath: path.join(process.cwd(), '/grunt/config'),

        /*
         * load these npm modules automatically
         */
        loadGruntTasks: {
            pattern: ['grunt-*',
                '@*/grunt-*',
                'jit-grunt',
                '!grunt-template-jasmine-requirejs'
            ],
            config: require('./package.json'),
            scope: 'devDependencies'
        },

        /* 
         * instead of grunt.registerTask('<task>', [...]) we use jitGrunt
         * files are in the pattern grunt/tasks/<task>.js
         */
        jitGrunt: {
            customTasksDir: 'grunt/tasks',

            //include replace needs static mapping
            //https://www.npmjs.com/package/load-grunt-config
            staticMappings: {
                includereplace: 'grunt-include-replace'
            }
        },

        data: aws

    });

};