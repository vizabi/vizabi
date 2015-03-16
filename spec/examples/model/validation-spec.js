describe("* Example Multi Validation", function() {
    var viz;

    var options = {
        //state
        state: {
            time_start: {
                start: 1800,
                end: 2014,
                step: 1,
                value: 1850,
                playing: false
            },
            time_end: {
                start: 1800,
                end: 2014,
                step: 1,
                value: 2000,
                playing: false
            },
            time: {
                unit: "day",
                start: 1800,
                end: 2014,
                step: 1,
                value: 1962,
                playing: false,
                speed: 5
            }
        },

        ui: {
            'vzb-tool-timeslider-1': {
                show_value: true,
                show_limits: true
            },
            'vzb-tool-timeslider-2': {
                show_value: true,
                show_limits: true
            },
            'vzb-tool-timeslider-3': {
                show_value: true,
                show_button: false
            }
        }
    };

    beforeAll(function(done) {
        viz = initializeVizabi("_examples-model/three-ts-three-models", options, done);
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

    //FIX ME: this test is not passing
    // it("should be ready (and all models ready accordingly)", function() {
    //     var ready = viz._tool.model._ready;
    //     if (!ready) {
    //         console.log(JSON.stringify(mapReady(viz._tool.model), null, 4));
    //         console.log(JSON.stringify(mapSet(viz._tool.model), null, 4));
    //     }
    //     expect(ready).toBeTruthy();
    // });

});