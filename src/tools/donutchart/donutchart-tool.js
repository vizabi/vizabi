/*!
 * VIZABI BUBBLECHART
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    //extend the base Tool class and register it in Vizabi tools under a name 'DunutChart'
    Vizabi.Tool.extend('DonutChart', {

        //Run when the tool is created
        init: function(config, options) {

            //Let's give it a name
            this.name = "donutchart";

            //Now we can specify components that should be included in the tool: 
            this.components = [{
                //choose which component to use:
                //at this point you can check Vizabi.Component.getCollection() to see which components are available
                component: 'gapminder-donutchart', 
                //these placeholdes are defined by the Tool prototype class
                placeholder: '.vzb-tool-viz', 
                //component should have access to the following models:
                model: ["state.time", "state.entities", "state.marker", "language"] 
            }, {
                component: 'gapminder-timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"]
            }];

            //provide the default options
            this.default_options = {
                state: {
                    // available time would have the range of 1990-2012 years (%Y), with the deafult position at 2000
                    time: {
                        start: "1990",
                        end: "2012",
                        value: "2000"
                    },
                    //Entities include all ("*") geo's of category "regions" -- equivalent to 'geo: ["asi", "ame", "eur", "afr"]'
                    entities: {
                        show: {
                            dim: "geo",
                            filter: {
                                _defs_: {
                                    "geo": ["*"],
                                    "geo.category": ["region"]
                                }
                            }
                        }
                    },
                    //Markers correspond to visuals that we want to show. We have label, axis and color
                    marker: {
                        dimensions: ["entities", "time"],
                        label: {
                            use: "property",
                            which: "geo.name"
                        },
                        axis: {
                            use: "indicator",
                            which: "pop"
                        },
                        color: {
                            use: "property",
                            which: "geo.region"
                        }
                    }
                },
                //specify where we get the data from
                data: {
                    reader: "json-file",
                    path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.json"
                },

                //default language strings. Let's keep it minimal for now
                language: {
                    id: "en",
                    strings: {
                        _defs_: {
                            en: {
                                "buttons/colors": "Colors",
                                "indicator/pop": "Population",
                                "indicator/geo.region": "Region",
                                "indicator/geo": "Geo code"
                            }
                        }
                    }
                }
            };

            //constructor is the same as any tool
            this._super(config, options);
        }

    });
}).call(this);