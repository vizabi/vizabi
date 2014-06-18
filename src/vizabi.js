(function(root) {

    /*
     * Vizabi initialization
     */
    var Vizabi = function(name, container, options) {
        var _this = this,
            core;

        //TODO: avoid loading requirejs more than once
        //add requireJS
        getScript("../bower_components/requirejs/require.js", function() {
            //load configuration and paths

            //TODO: config should have a base url...
            require(["../dist/config"], function(config) {
                //config is now available
                require.config(config.require);
                //start vizabi
                require(["core"], function(Core) {
                    core = new Core();

                    //start core
                    var promise = core.start(name,
                        container,
                        options);

                    //tell external page that vizabi is ready
                    promise.then(
                        function() {
                            if (typeof options.ready === "function") {
                                options.ready();
                            }
                        },
                        //or tell external page that there's an error

                        function(err) {
                            if (typeof options.ready === "function") {
                                options.ready(err);
                            }
                        });
                });
            });
        });

        this.setOptions  = function (tool_name, opts) {
            if (core) core.setOptions(tool_name, opts);
        };
    };

    /*
     * Make Vizabi global
     */
    root.Vizabi = root.Vizabi || Vizabi;


    //inject script

    function getScript(src, loaded) {
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function() {
            if (typeof loaded === "function") {
                loaded();
            }
        };
        script.src = src;
        document.getElementsByTagName('head')[0].appendChild(script);
    }


})(window);