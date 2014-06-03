(function (root) {

    root.vizabi = root.vizabi || {};
    
    var viz_name, viz_container, viz_state, viz_ready;
    root.vizabi.start = function(name, container, state) {
        viz_name = name;
        viz_container = container;
        viz_state = state || {};
    };

    root.vizabi.ready = function(func) {
    	viz_ready = func;
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
            //start vizabi
            require(["core"], function(core) {
                var core = new core();
                //user defined ready function
                vizabi.viz = core.start(viz_name, viz_container, viz_state);

                if(typeof viz_ready === "function") {
                	viz_ready();
                }

            });
        });
    });

})(window);