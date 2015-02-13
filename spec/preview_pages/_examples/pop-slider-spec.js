describe("* _examples/pop-slider", function() {
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
                value: "1995"
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

    beforeAll(function(done) {
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

    describe("play events", function() {
        var value = parseInt(options.state.time.value, 10),
            end = parseInt(options.state.time.end, 10),
            total = end - value,
            time = parseInt(options.state.time.speed, 10) / parseInt(options.state.time.step, 10) * total;

        beforeAll(function(done) {

            viz.setOptions({
                state: {
                    time: {
                        playing: true
                    }
                }
            });

            setTimeout(function() {
                done();
            }, time * 3);
        });

        it("should end in the last year", function() {
            var new_options = viz.getOptions();
            var text_year = new Date(new_options.state.time.value).getFullYear();
            text_year = parseInt(text_year, 10);
            expect(text_year).toEqual(end);
        });
    });

    describe("resize events", function() {
        var size;
        beforeEach(function(done) {
            size = $('.vzb-tool-content').width();
            mobile(false);
            setTimeout(function() {
                done();
            }, 50);
        });

        it("should scale when screen is resized", function() {
            expect($('.vzb-tool-content').width()).toBeGreaterThan(size);
        });
    });

});