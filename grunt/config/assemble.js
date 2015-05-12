//Assemble task for preview pages
var preview_src = 'preview_src/';
var preview_dist = 'preview/';

module.exports = {
    // Task-level options.
    options: {
        flatten: true,
        assets: preview_dist + 'assets/',
        layout: preview_src + 'templates/layouts/default.hbs',
        partials: preview_src + 'templates/partials/*.hbs',
        data: preview_src + 'config/*.{json,yml}'
    },
    dev: {
        options: {
            production: false
        },
        files: {
            'preview/': [preview_src + '_pages/**/*.hbs']
        }
    },
    prod: {
        options: {
            production: true
        },
        files: {
            'preview/': [preview_src + '_pages/**/*.hbs']
        }
    }


};