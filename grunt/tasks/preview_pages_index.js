/*
 * ---------
 * Building custom preview_page
 */

module.exports = function(grunt) {

    grunt.registerTask('preview_pages_index', 'Writes preview_pages index', function() {

        var preview_pages_folder = 'preview/preview_pages/',
            preview_pages_index = preview_pages_folder + 'index.html',
            contents = '<link rel="stylesheet" href="assets/style.css">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' +
            '<div class="index"><h1>Vizabi Preview Pages:</h1>',
            current_dir;

        grunt.file.recurse(preview_pages_folder, function(abs, root, dir, file) {
            if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                if (current_dir !== dir) {
                    current_dir = dir;
                    contents += "<h2>" + dir + "</h2>";
                }
                var link = dir + '/' + file;
                var preview_page = "<p><a href='" + link + "'>" + file + "</a></p>";
                contents += preview_page;
            }
        });
        contents += "</div>";
        grunt.file.write(preview_pages_index, contents);
        grunt.log.writeln("Wrote preview_pages index.");
    });

};