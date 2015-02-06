describe("_examples/pop-slider", function() {
    var viz;

    var options = {
        //state
        state: {
            //time properties
            time: {
                unit: "year",
                start: "1800",
                end: "2014",
                step: 1,
                speed: 50,
                value: "2002"
            },
            //entities we want to show
            entities: {
                show: {
                    dim: "geo",
                    filter: {
                        "geo": ['swe', 'nor', 'usa', 'aus'],
                        "geo.category": ["country"]
                    }
                }
            },

            row: {
                hook_to: ["entities", "time", "data", "language"],
                label: {
                    hook: "property",
                    value: "geo.name"
                },
                number: {
                    hook: "indicator",
                    value: "pop"
                },
                color: {
                    hook: "property",
                    value: "geo.region",
                    //red, yellow, green, blue
                    domain: ["#F77481", "#E1CE00", "#B4DE79", "#62CCE3"]
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
                "en": {
                    "intro_text": "This example shows the tool Pop Slider with model adaptations and data support"
                },
                "pt": {
                    "intro_text": "Esse exemplo mostra a Pop Slider com adaptações em model and suporte a dados"
                }
            }
        }
    };

    beforeEach(function(done) {
        viz = initializeVizabi("_examples/pop-slider", options, done);
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
        var ready = viz._tool.model._ready;
        if (!ready) {
            console.log(JSON.stringify(mapReady(viz._tool.model), null, 4));
        }
        expect(ready).toBeTruthy();
    });

    describe("play events", function() {
        var text_year;
        var start = parseInt(options.state.time.start, 10),
            end = parseInt(options.state.time.end, 10),
            total = end - start,
            time = parseInt(options.state.time.speed, 10) / parseInt(options.state.time.step, 10) * total;

        beforeEach(function(done) {

            viz.setOptions({
                state: {
                    time: {
                        playing: true
                    }
                }
            });

            setTimeout(function() {
                text_year = $(".vzb-tool-pop-slider .vzb-year-display").text();
                text_year = parseInt(text_year, 10);
                done();
            }, time * 2);
        });

        it("should end in the last year", function() {
            expect(text_year).toEqual(end);
        });
    });

});