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
    prod: {
        files: {
            'preview/': [preview_src + '_pages/**/*.hbs']
        }
    },
    fullscreen: {
        options: {
            layout: preview_src + 'templates/layouts/fullscreen.hbs',
        },
        files: {
            'preview/fullscreen/': [preview_src + '_pages/**/*.hbs']
        }
    }


};