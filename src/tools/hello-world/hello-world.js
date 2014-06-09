define([
    'underscore',
    'tools/tool'
], function(_, Tool) {
    //TODO: put a convention for the folder to indicate its an example: example-hello-world
    //TODO: put a state validator in a data helper which is responsible for this tools use of data
    //TODO: enforce a model for the state 
    //TODO: isolate the views update based on data in a single place -- possibly a glue look-alike ?!
    var helloWorld = Tool.extend({
        init: function(context, options) {
            this.name = 'hello-world';
            this.placeholder = options.placeholder;
            
            //TODO: remove hardcoded states from all over vizabi, they can only exist in surrounding page
            this.state = _.extend({
                show: {
                    'world': {

                    }
                },
                time: '1980',
                //TODO: timeRange can come from data
                timeRange: [1800, 2000],
                yaxis: {
                    indicator: 'gdp'
                },
                waffle: {
                    path: '../src/tools/hello-world/waffles/'
                },
                //TODO: Remove this part from the state
                stats: {
                    path: '../src/tools/hello-world/waffles/stats/'
                }
            }, options.state);

            //TODO: refactor the way we pass the state forward
            options.state = this.state;

            //TODO: selectors should be improved
            this.components = {
                // TODO: turn the value into an object with their options or state
                // TODO: put he components into objects with unique ids
                'bar-chart': '.vizabi-tool-viz',
                'timeslider': '.vizabi-tool-timeslider',
                'buttonlist': '.vizabi-tool-buttonlist'
                // "title": ".vizabi-tool-title",
            };

            this._super(context, options);

            //TODO: Here send the state for validation and get back whether its valid or not
            // ---- > add a data layer
            // -----> add a data reader specific to waffle
        }
    });

    return helloWorld;
});