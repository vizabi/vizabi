/*
 * ---------
 * //TODO: Improve this task
 * Hotfix to include everything into the AMD
 * Include every tool and component into src/plugins.js
 */

module.exports = function(grunt) {
    grunt.registerTask('write_plugins', 'Includes every component and tool into the AMD module', function() {

        var tools_folder = 'src/tools/',
            components_folder = 'src/components/',
            models_folder = 'src/models/',
            readers_folder = 'src/readers/',
            plugins_file = 'src/plugins.js',
            contents = [],
            current_dir;

        grunt.file.recurse(tools_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (typeof dir !== 'undefined' && /\.js$/.test(file)) {
                // src/tools/_examples/bar-chart/bar-chart.js --> tools/_examples/bar-chart/bar-chart 
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            } else if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                clean_abs = abs.replace("src/", "");
                contents.push('"text!' + clean_abs + '"');
            }
        });

        grunt.file.recurse(components_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (typeof dir !== 'undefined' && /\.js$/.test(file)) {
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            } else if (typeof dir !== 'undefined' && /\.html$/.test(file)) {
                clean_abs = abs.replace("src/", "");
                contents.push('"text!' + clean_abs + '"');
            }
        });

        grunt.file.recurse(models_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (/\.js$/.test(file)) {
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            }
        });

        grunt.file.recurse(readers_folder, function(abs, root, dir, file) {
            var clean_abs;
            if (/\.js$/.test(file)) {
                clean_abs = abs.replace(".js", "").replace("src/", "");
                contents.push('"' + clean_abs + '"');
            }
        });

        //hotfix all files in global variable AS WELL
        contents = 'var _vzb_available_plugins=[' + contents.join(",") + ']; define([' + contents.join(",") + '], function() {});';
        grunt.file.write(plugins_file, contents);

        grunt.log.writeln("All tools and components have been included in the AMD module.");
    });
};