(function (root) {
    
    /*
     * Vizabi initialization
     */
    var Vizabi = function(name, container, options) {
        this.name = name;
        this.container = container;
        this.options = options;
        //this.readyFunc = function() {};

        var _this = this;

        //TODO: avoid loading requirejs more than once
        //add requireJS
        getScript("../bower_components/requirejs/require.js", function() {
            //load configuration and paths

            //TODO: config should have a base url...
            require(["../dist/config"], function(config) {
                //config is now available
                require.config(config.require);
                //start vizabi
                require(["core"], function(core) {
                    var core = new core();

                    //start core
                    var promise = core.start(_this.name,
                                             _this.container,
                                             _this.options);

                    //tell external page that vizabi is ready
                    promise.then(
                    function() {
                        if(typeof _this.options.ready === "function") {
                             _this.options.ready();
                        }
                    },
                    //or tell external page that there's an error
                    function(err) {
                        if(typeof  _this.options.ready === "function") {
                             _this.options.ready(err);
                        }
                    })
                });
            });
        });
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
        script.onload = function(){
            if(typeof loaded === "function") {
                loaded();
            }
        };
        script.src = src;
        document.getElementsByTagName('head')[0].appendChild(script);
    }


})(window);