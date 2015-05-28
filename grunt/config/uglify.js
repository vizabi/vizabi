// Uglifying JS files
module.exports = {
    files: {
        cwd: 'dist/', // base path
        src: 'vizabi.js', // source files mask
        dest: '.tmp', // destination folder
        expand: true, // allow dynamic building
        mangle: false, // disallow change in names
        flatten: false // remove all unnecessary nesting
    }
};