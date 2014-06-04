define([
    'underscore',
    'tools/tool'
], function(_, Tool) {

    var helloWorld = Tool.extend({
        init: function(context, options) {
            this.name = 'hello-world';
            this.placeholder = options.placeholder;
            this.state = _.extend({
                show: {
                    'world': {

                    }
                },
                time: '1980',
                yaxis: {
                    indicator: 'gdp'
                }
            }, options.state);

            this._super(context, options);
        }
    });

    return helloWorld;
});