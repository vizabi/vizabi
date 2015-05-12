//includereplace is used to build preview pages
module.exports = {
    build: {
        options: {
            prefix: '<!-- @@',
            suffix: ' -->'
        },
        src: 'src/build/vizabi-amd.frag',
        dest: 'src/vizabi-amd.js'
    }
};