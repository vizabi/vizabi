describe("* Base: Events", function() {

    var evts, a;

    beforeEach(function() {
        evts = new Vizabi.Events();
        a = 0;
    });

    it("should trigger events", function() {
        evts.on("test", function() {
            a = 42;
        });
        evts.trigger("test");
        expect(a).toEqual(42);
    });

    it("should trigger events with arguments", function() {
        evts.on("sum", function(evt, num) {
            a = num;
        });
        evts.trigger("sum", 2);
        expect(a).toEqual(2);
    });

    it("should unbind events", function() {
        evts.on("sum", function() {
            a = a + 1;
        });
        evts.unbind("sum");
        evts.trigger("sum");
        expect(a).toEqual(0);
    });

    it("should trigger all events in correct order", function() {
        evts.on("minus:equal", function() {
            a = 3;
        });
        evts.on("minus", function() {
            a = a - 1;
        });
        evts.triggerAll("minus:equal");
        //if order is wrong, a = 3
        expect(a).toEqual(2);
    });

    describe("- Freezing events", function() {

        var a, evts;

        beforeEach(function() {
            evts = new Vizabi.Events();
            evts.on("sum", function() {
                a = a + 1;
            });
            evts.on("multiply", function() {
                a = a * 4;
            });
            //make sure nothing is frozen globally
            Vizabi.Events.unfreezeAll();
            a = 0;
        });

        it("should freeze events", function() {
            evts.freeze();
            evts.trigger("sum");
            expect(a).toEqual(0);
        });

        it("should unfreeze events", function() {
            evts.freeze();
            evts.trigger("sum");
            expect(a).toEqual(0);
            evts.unfreeze();
            expect(a).toEqual(1);
        });

        it("should freeze with exceptions", function() {
            evts.freeze("sum");
            evts.trigger("sum");
            evts.trigger("multiply");
            expect(a).toEqual(1);
        });

        it("should freeze globally", function() {
            Vizabi.Events.freezeAll();
            evts.trigger("sum");
            expect(a).toEqual(0);
        });

        it("should unfreeze globally", function() {
            Vizabi.Events.freezeAll();
            evts.trigger("sum");
            expect(a).toEqual(0);
            Vizabi.Events.unfreezeAll();
            expect(a).toEqual(1);
        });

    });

    describe("- Chained events", function() {

        var rendered, evts;

        it("should trigger chained event", function() {
            evts = new Vizabi.Events();
            evts.on("render", function() {
                rendered = true;
            });
            evts.on("load", function() {
                evts.trigger("render");
            });
            evts.trigger("load");
            expect(rendered).toBe(true);
        });

    });

});