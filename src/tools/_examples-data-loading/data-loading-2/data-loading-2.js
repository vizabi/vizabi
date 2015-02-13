//Data Loading 2
define([
    'base/tool'
], function(Tool) {

    var DataLoading2 = Tool.extend({

        /**
         * Initializes the tool (Data Loading 2).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {

            this.name = "data-loading-2";
            this.template = "tools/_examples-data-loading/data-loading-2/data-loading-2";

            //before initializing, inject model configuration,
            if (!options.state.dependencies) {
                var dependencies = buildDepObj(options.state.deps);
                options.state.dependencies = dependencies;
            }

            //specifying components
            this.components = [{
                component: '_examples/display-graph',
                placeholder: '.vzb-display-graph-wrapper',
                model: ["state"]
            }];

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            var deps = model.state.dependencies;

            //simulate data loading with data loading models
            var c = 0; // avoid while(true) loop
            var models = [].slice.call([deps]);

            //for each submodel in the list, check if should load
            while (++c < 100 && models.length) {
                var m = models.shift();

                //simulate loading if appropriate
                if (m.external_loading && !m.loaded_data && !m.isLoading("data_simulation")) {
                    m.setLoading("data_simulation");

                    //self executing function to keep scope of m
                    (function(mod) {
                        //take a few ms to load data
                        setTimeout(function() {
                            console.log(mod);
                            mod.loaded_data = [1, 2, 3, 4, 5]; //simulate loading this data
                            mod.setLoadingDone("data_simulation");
                        }, Math.round(Math.random() * 100));

                    })(m);
                }

                //add submodels as children
                var children = _.values(m.getSubmodels());
                if (children.length) {
                    models = [].slice.call(children).concat(models);
                }
            }


        }
    });

    //receives an array of dependency and returns an object
    function buildDepObj(array) {
        //start structures
        var trees = {};
        var roots = [];
        for (var i = 0; i < array.length; i++) {
            var node = array[i];
            trees[node.name] = {};
            if (node.type === "hook") {
                trees[node.name].hook = "indicator";
                trees[node.name].value = "pop";
            } else if (node.type === "external") {
                trees[node.name].external_loading = true;
            }
            roots.push(node.name);
        };

        //compute tree
        for (var i = 0; i < array.length; i++) {
            var node = array[i];
            if (node.dep) {
                var name = node.name,
                    dep = node.dep;
                trees[dep][name] = trees[name];
                roots = _.without(roots, name);
            }
        }

        if (roots.length > 1) {
            console.error("More than one root");
        }
        if (roots.length == 0) {
            console.error("No root, circular dependency");
        }

        trees[roots[0]].hook_to = ["entities", "time", "data", "language"];

        return trees[roots[0]];
    }

    return DataLoading2;
});