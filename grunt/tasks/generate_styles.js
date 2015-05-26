/*
 * ---------
 * Include all tool styles into vizabi.scss
 */

module.exports = function(grunt) {
    grunt.registerTask('generate_styles', 'Adds each tool scss to vizabi.scss', function() {

        var tools_folder = 'src/tools/',
            scss_file = 'src/assets/style/vizabi.scss',
            includes = ['_vizabi.scss'],
            contents = '',
            current_dir;

        grunt.file.recurse(tools_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && /\.scss$/.test(file)) {
                var clean_abs = abs.replace("src/", "");
                includes.push('../../' + clean_abs);
            }
        });

        for (var i = 0; i < includes.length; i++) {
            contents += '@import "' + includes[i] + '";\n';
        }

        grunt.file.write(scss_file, contents);

        grunt.log.writeln("All styles included in vizabi.scss");
    });
};