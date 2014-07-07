define([
    'underscore',
    'tools/tool'
], function(_, Tool) {
    //TODO: put a convention for the folder to indicate its an example: example-hello-world
    //TODO: put a state validator in a data helper which is responsible for this tools use of data
    //TODO: isolate the views update based on data in a single place -- possibly a glue look-alike ?!
    var helloWorld = Tool.extend({
        init: function(parent, options) {
            this.name = 'hello-world';
            this.template = "tools/hello-world/hello-world";
            this.placeholder = options.placeholder;
        
            //TODO: refactor the way we pass the state forward
            this.state = options.state;
            // this is where hardcoded defaults can kick in (if( missing props in state {....}))

            //TODO: selectors should be improved
            this.components = {
                // TODO: turn the value into an object with their options or state
                // TODO: put he components into objects with unique ids
                'bar-chart': '.vizabi-tool-viz',
                'timeslider2': '.vizabi-tool-timeslider',
                //TODO: Ola's input in the meeting: (The following is how state looks when statemapping is in place)
                //stateMapping:{{range:"timeRange", time:"startTime"}, 
                'buttonlist': '.vizabi-tool-buttonlist'
                // "title": ".vizabi-tool-title",
            };

            this._super(parent, options);

            //TODO: Here send the state for validation and get back whether its valid or not
            // ---- > add a data layer
            // -----> add a data reader specific to waffle
        }
    });
    
    //statePropertyMapping: {time:}
    
    //constructDataQueryFromState(){}

    return helloWorld;
});