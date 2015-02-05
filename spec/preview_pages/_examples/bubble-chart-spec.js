describe("_examples/bubble-chart", function() {
    var viz;

    var options = {
        //state
        state: {

            //timespan of the visualization
            time: {
                start: 1990,
                end: 2012,
                value: 1995,
                step: 1,
                speed: 300,
                formatInput: "%Y"
            },

            //entities we want to show
            entities: {
                show: {
                    dim: "geo",
                    filter: {
                        "geo": ['swe', 'nor', 'fin', 'bra', 'usa', 'chn', 'jpn', 'zaf', 'ind', 'ago'],
                        "geo.category": ["country"]
                    }
                }
            },

            //how we show it
            marker: {
                hook_to: ["entities", "time", "data", "language"],
                type: "geometry",
                shape: "circle",
                label: {
                    hook: "property",
                    value: "geo.name"
                },
                axis_y: {
                    hook: "indicator",
                    value: "lex",
                    scale: 'linear'
                },
                axis_x: {
                    hook: "indicator",
                    value: "gdp_per_cap",
                    scale: 'linear',
                    unit: 100
                },
                size: {
                    hook: "indicator",
                    value: "pop",
                    scale: 'log'
                },
                color: {
                    hook: "indicator",
                    value: "lex",
                    domain: ['#F77481', '#E1CE00', '#B4DE79']
                }
            }
        },

        //where do we get data from?
        data: {
            reader: 'local-json',
            path: 'local_data/waffles/{{LANGUAGE}}/basic-indicators.json'
        },

        //language properties
        language: {
            id: "en",
            strings: {
                en: {
                    "title": "Bubble Chart Title",
                    "buttons/find": "Find",
                    "buttons/colors": "Colors",
                    "buttons/size": "Size",
                    "buttons/more_options": "Options"
                },
                pt: {
                    "title": "Título do Bubble Chart",
                    "buttons/find": "Encontre",
                    "buttons/colors": "Cores",
                    "buttons/size": "Tamanho",
                    "buttons/more_options": "Opções"
                }
            }
        }
    };

    beforeEach(function(done) {
        viz = initializeVizabi("_examples/bubble-chart", options, done);
    });

    it("should exist", function() {
        expect(viz).not.toBeNull();
        expect(typeof viz).toBe('object');
    });

    it("should not be empty", function() {
    	var contents = $(viz._placeholder).children();
        expect(contents.length).toBeGreaterThan(0);
    });

    it("should be ready", function() {
    	console.log(JSON.stringify(viz._tool.model.getObject()));
    	console.log(viz._tool.model._ready);
        expect(viz._tool.model._ready).toBeTruthy();
    });

});