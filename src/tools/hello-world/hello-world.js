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

            //todo: selectors should be improved
            this.widgets = {
                // "bar-chart": ".vizabi-tool-viz",
                "timeslider": ".vizabi-tool-timeslider"
                // "button-list": ".vizabi-tool-button-list",
                // "title": ".vizabi-tool-title",
            }

            this._super(context, options);
        }

    });

    return helloWorld;
});