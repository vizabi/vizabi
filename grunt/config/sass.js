// Compile SCSS files into CSS (dev mode is not compressed)
module.exports = {
    dev: {
        options: {
            style: 'expanded'
        },
        files: {
            'preview_src/assets/css/main.css': 'preview_src/assets/sass/main.scss',
            'dist/vizabi.css': 'src/assets/style/vizabi.scss'
        }
    },
    prod: {
        options: {
            style: 'compressed'
        },
        files: {
            'preview_src/assets/css/main.css': 'preview_src/assets/sass/main.scss',
            'dist/vizabi.css': 'src/assets/style/vizabi.scss'
        }
    }
};