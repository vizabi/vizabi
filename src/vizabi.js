var Vizabi = function(tool_path, container, options) {
    var loaded = false,
        viz = {
            _tool: null,
            name: null,
            placeholder: null,
            setOptions: function(opts, overwrite) {
                if (tool) tool.setOptions(opts, overwrite);
            }
        };

    //require to import all tools, components, etc to AMD version
    require(["plugins"], function() {

        var tool_name = tool_path.split("/").pop(),
            path = 'tools/' + tool_path + '/' + tool_name;

        // extending options with name and tool's placeholder
        viz.name = tool_name;
        viz.placeholder = container;

        //require and render tool
        require([path], function(Tool) {
            viz._tool = new Tool(viz, options);
        });

    });

    /* Vizabi API Methods*/
    return viz;

};