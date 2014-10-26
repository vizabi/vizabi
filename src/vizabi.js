var Vizabi = function(tool_path, container, options) {
    var loaded = false,
        tool;

    //require to import all tools, components, etc to AMD version
    require(["plugins"], function() {

        var tool_name = tool_path.split("/").pop(),
            path = 'tools/' + tool_path + '/' + tool_name;

        // extending options with name and tool's placeholder
        options.name = tool_name;
        options.placeholder = container;

        //require and render tool
        require([path], function(Tool) {
            tool = new Tool(options);
            tool.render();
        });

    });

    /* Vizabi API Methods*/
    return {
        setOptions: function(opts, overwrite) {
            if (tool) tool.setOptions(opts, overwrite);
        }
    };

};