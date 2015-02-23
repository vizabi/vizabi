describe("* Example Pop slider with multiple dimensions", function() {
    var viz;

    var options = {
        //state
        state: {

            //time properties
            time: {
                unit: "year",
                start: "1990",
                end: "2014",
                step: 1,
                speed: 20,
                value: "1995",
                playable: false
            },
            //entities we want to show
            entities: {
                show: {
                    dim: "geo",
                    filter: {
                        "geo": ['swe', 'nor'],
                        "geo.category": ["country"]
                    }
                }
            },
            entities_age: {
                show: {
                    dim: "age",
                    filter: {
                        "age": ['5', '10']
                    }
                }
            },

            row: {
                hook_to: ["entities", "entities_age", "time"],
                label: {
                    hook: "property",
                    value: "geo.name"
                },
                label2: {
                    hook: "property",
                    value: "age"
                },
                number: {
                    hook: "indicator",
                    value: "pop"
                },
                color: {
                    hook: "property",
                    value: "age",
                    //red, yellow, green, blue
                    domain: ["#F77481", "#62CCE3", "#B4DE79"]
                }
            }
        },

        //where do we get data from?
        data: {
            reader: 'local-json',
            path: 'local_data/waffles/{{LANGUAGE}}/multi-dimensional.json'
        },

        //language properties
        language: {
            id: "en",
            strings: {
                "en": {
                    "intro_text": "This example shows the tool Pop Slider with multi dimensional support. The dimensions are ['geo', 'age', 'time'] and it shows populations of two age groups from Sweden and Norway"
                },
                "pt": {
                    "intro_text": "Esse exemplo mostra a Pop Slider com suporte a multi dimensões"
                }
            }
        },

        ui: {
            'vzb-tool-timeslider': {
                show_limits: true,
                show_value: true
            }
        }
    };

    beforeEach(function(done) {
        viz = initializeVizabi("_examples/pop-slider", options, done);
        mobile(true); //test with mobile resolution;
    });

    it("should be instantiated", function() {
        expect(viz).not.toBeNull();
        expect(typeof viz).toBe('object');
    });

    it("should not have an empty div", function() {
        var contents = $(viz._placeholder).children();
        expect(contents.length).toBeGreaterThan(0);
    });

    it("should be ready (and all models ready accordingly)", function() {
        var ready = viz._tool.model._ready;
        if (!ready) {
            console.log(JSON.stringify(mapReady(viz._tool.model), null, 4));
        }
        expect(ready).toBeTruthy();
    });

});