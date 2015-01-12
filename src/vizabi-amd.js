define([], function() {

	var Vizabi = function(tool_path, container, options) {
    var loaded = false,
        tool;

    //require to import all tools, components, etc to AMD version
    require(["plugins"], function() {

        var tool_name = tool_path.split("/").pop(),
            path = 'tools/' + tool_path + '/' + tool_name;

        // extending options with name and tool's placeholder
        var config = {
            name: tool_name,
            placeholder: container
        };

        //require and render tool
        require([path], function(Tool) {
            tool = new Tool(config, options);
        });

    });

    /* Vizabi API Methods*/
    return {
        setOptions: function(opts, overwrite) {
            if (tool) tool.setOptions(opts, overwrite);
        }
    };

};


	return Vizabi;

});