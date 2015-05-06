// Compile SCSS files into CSS (dev mode is not compressed)
module.exports = {
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
};