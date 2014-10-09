define([
    'underscore',
    'base/tool'
], function(_, Tool) {

    var barChart = Tool.extend({
        init: function(parent, options) {

            this.name = 'bar-rank';
            this.template = "tools/bar-rank/bar-rank";
            this.placeholder = options.placeholder;

            //TODO: refactor the way we pass the state forward
            this.state = options.state;
            // this is where hardcoded defaults can kick in (if( missing props in state {....}))

            //add components
            this.addComponent('header', {
                placeholder: '.vizabi-tool-title'
            });
            this.addComponent('bar-rank', {
                placeholder: '.vizabi-tool-viz'
            });
            this.addComponent('timeslider2', {
                placeholder: '.vizabi-tool-timeslider'
            });
            this.addComponent('buttonlist', {
                placeholder: '.vizabi-tool-buttonlist',
                buttons: [{
                            id: "geo",
                            title: "Country",
                            icon: "globe",

                        }],
                data: options.data
            });

            this._super(parent, options);

            //TODO: Here send the state for validation and get back whether its valid or not
            // ---- > add a data layer
            // -----> add a data reader specific to waffle
        },

        //TODO: Check mapping options

        //1)

        // this.addComponent('timeslider', {
        //     placeholder: '.vizabi-tool-timeslider',
        //     model: function() {
        //         return {
        //             year: this.model.getState("time"),
        //         }
        //     }
        // });

        //2)

        // modelMapping: function() {
        //     var _this = this;

        //     return {
        //         'bar-rank': {
        //             year: this.model.getState("time"),
        //             indicator: this.model.getState("yaxis").indicator,
        //             data: this.model.getData()[0],
        //             labels: this.model.getData()[1],
        //             scale: this.model.getState("yaxis").scale,
        //             unit: this.model.getState("yaxis").unit
        //         },
        //         'timeslider': {
        //             year: this.model.getState("time"),
        //             min_year: _.min(_.map(this.model.getData()[0],
        //                 function(d) {
        //                     return +d.year;
        //                 })),
        //             max_year: _.max(_.map(this.model.getData()[0],
        //                 function(d) {
        //                     return +d.year;
        //                 })),
        //         },
        //         'buttonlist': {
        //             buttons: [{
        //                 id: "geo",
        //                 title: "Country",
        //                 icon: "globe"
        //             }, {
        //                 id: "find",
        //                 title: "Find",
        //                 icon: "search"
        //             }, {
        //                 id: "options",
        //                 title: "Options",
        //                 icon: "gear"
        //             }, {
        //                 id: "colors",
        //                 title: "Colors",
        //                 icon: "pencil"
        //             }, {
        //                 id: "speed",
        //                 title: "Speed",
        //                 icon: "dashboard"
        //             }, {
        //                 id: "find",
        //                 title: "Find",
        //                 icon: "search"
        //             }, {
        //                 id: "options",
        //                 title: "Options",
        //                 icon: "gear"
        //             }]
        //         }
        //     };
        // },

        //build query from state

        //TODO: this could be moved to the tool if we find a
        //common state pattern
        getQuery: function() {
            //build query with state info
            var query = [{
                    select: [
                        'geo',
                        'time',
                        'geo.name',
                        'geo.category',
                        this.model.getState("indicator")
                    ],
                    where: {
                        geo: this.model.getState("show").geo,
                        'geo.category': this.model.getState("show")['geo.category'],
                        time: this.model.getState("timeRange")
                    }}];

            return query;
        }
    });



    //statePropertyMapping: {time:}

    //constructDataQueryFromState(){}

    return barChart;
});
