describe("* Example Bubble Chart", function() {
    var viz;

    var options = {
        //state
        state: {

            //timespan of the visualization
            time: {
                start: 1990,
                end: 1995,
                value: 1990,
                step: 1,
                speed: 50,
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
                dimensions: ["entities", "time"],
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
                }
            }
        },

        //where do we get data from?
        data: {
            reader: 'local-json',
            path: 'local_data/waffles/{{LANGUAGE}}/basic-indicators.json'
        }
    };

    beforeEach(function(done) {
        viz = initializeVizabi("_examples/bubble-chart", options, done);
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


    describe("play tasks", function() {
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
                done();
            }, time * 4);
        });

        it("should end in the last year", function() {
            var text_year = $(".vzb-bubble-chart .vzb-bc-year").text();
            text_year = parseInt(text_year, 10);
            expect(text_year).toEqual(end);
        });
    });

    describe("select tasks", function() {

        beforeEach(function(done) {
            $("circle.vzb-bc-entity").first().d3Click();

            setTimeout(function() {
                done();
            }, 200);
        });

        it("should highlight when selected", function() {
            expect($('.vzb-bc-selected').length).toEqual(1);
        });
        it("should show one label", function() {
            expect($(".vzb-bc-labels .vzb-bc-entity").length).toEqual(1);
        });

        it("should draw trails", function() {
            viz.setOptions({
                state: {
                    time: {
                        value: 1995
                    }
                }
            });

            var trailsGroup = $('.vzb-bc-trails .vzb-bc-entity').first();
            var trails = trailsGroup.find('.trailSegment');
            expect(trails.length).toBeGreaterThan(0);

        });
    });


    describe("resize tasks", function() {
        var size;
        beforeEach(function(done) {
            size = $('.vzb-bubble-chart-svg').width();
            mobile(false);
            setTimeout(function() {
                done();
            }, 50);
        });

        it("should scale when screen is resized", function() {
            expect($('.vzb-bubble-chart-svg').width()).toBeGreaterThan(size);
        });
    });

});