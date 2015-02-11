describe("_examples-data-loading/dependencies", function() {
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
                playable: false,
                speed: 50,
                formatInput: "%Y"
            },

            //entities we want to show
            entities: {
                show: {
                    dim: "geo",
                    filter: {
                        "geo": ['swe', 'nor', 'fin'],
                        "geo.category": ["country"]
                    }
                }
            },

            //how we show it
            deps: {
                hook_to: ["entities", "time", "data", "language"],
                label: {
                    hook: "property",
                    value: "geo.name"
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
        viz = initializeVizabi("_examples-data-loading/data-loading-2", options, done);
        mobile(true); //test with mobile resolution;
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

});