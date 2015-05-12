// Uglifying JS files
module.exports = {
    files: {
        cwd: 'src/', // base path
        src: '**/*.js', // source files mask
        dest: 'dist', // destination folder
        expand: true, // allow dynamic building
        mangle: false, // disallow change in names
        flatten: false // remove all unnecessary nesting
    }
};