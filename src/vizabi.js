var Vizabi = function(tool_path, container, options) {

    var tool_name = tool_path.split("/").pop(),
        path = 'tools/' + tool_path + '/' + tool_name,
        loaded = false,
        viz = {
            _name: tool_name,
            _placeholder: container,
            _tool: null
        },
        tool;

    //require to import all tools, components, etc to AMD version
    require(["plugins"], function() {

        //require and render tool
        require([path], function(Tool) {
            viz._tool = tool = new Tool({
                name: viz._name,
                placeholder: viz._placeholder
            }, options);

        });

    });

    /* Vizabi API Methods*/
    viz.setOptions = function(opts, overwrite) {
        if (tool) tool.setOptions(opts, overwrite);
    };
    viz.getOptions = function(opts, overwrite) {
        return (tool) ? tool.model.getObject() : {};
    };

    return viz;

};