/*
 * ---------
 * Building custom preview_page
 */

module.exports = function(grunt) {

    grunt.registerTask('preview_pages_menu', 'Writes _preview_pages.tpl', function() {

        var preview_pages_folder = 'preview_pages/',
            preview_pages_file = preview_pages_folder + 'assets/_preview.tpl',
            current_dir,
            contents = "";

        grunt.file.recurse(preview_pages_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                file = file.replace(".html", "");
                var link = dir + '/' + file;
                var preview_page = "<li><a onclick=\"goToExample('" + link + "');\">" + link + "</a></li>";
                contents += preview_page;
            }
        });
        grunt.file.write(preview_pages_file, contents);
        grunt.log.writeln("Wrote preview_pages menu template.");
    });

};