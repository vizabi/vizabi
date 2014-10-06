var Vizabi = function(name, container, options) {
    var _this = this,
        core;

    require(["base/core", "plugins"], function(Core) {
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

    //placeholder identifies the tool
    function setOptions(placeholder, opts) {
        if (core) core.setOptions(placeholder, opts);
    };

    /* Vizabi API Methods*/

    return {
        setOptions: setOptions
    };

};