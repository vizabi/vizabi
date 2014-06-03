(function (root) {

    root.vizabi = root.vizabi || {};
    
    var tool_name,
    	tool_container,
    	tool_state,
    	tool_ready,
    	vizabi_ready;

    root.vizabi.start = function(name, container, state, ready) {
        tool_name = name;
        tool_container = container;
        tool_state = state || {};
        tool_ready = ready;
    };

    root.vizabi.ready = function(func) {
    	vizabi_ready = func;
    };

    function getScript(src, loaded) {
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function(){
            if(typeof loaded === "function") {
                loaded();
            }
        };
        script.src = src;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    //add requireJS
    getScript("../bower_components/requirejs/require.js", function() {
        //load configuration and paths
        require(["vizabi-config"], function(config) {
            //config is now available
            require.config(config.require);
            //start vizabi
            require(["core"], function(core) {
                var core = new core();
                //user defined ready function
                vizabi.viz = core.start(tool_name, tool_container, tool_state, tool_ready);

                core.bind("ready:all", function() {
                	if(typeof vizabi_ready === "function") {
                		vizabi_ready();
                	}
                });
            });
        });
    });

})(window);