describe("* Base: Model", function() {

    var placeholder, MyModel;

    beforeAll(function() {
        //create a new component fo ryear display and register
        Vizabi.Model.unregister('mymodel');
        MyModel = Vizabi.Model.extend('mymodel', {
            init: function(values, parent, bind) {
                this._type = "time";
                //default values for time model
                values = Vizabi.utils.extend({
                    value: "1800",
                    start: "1800",
                    end: "2015",
                    submodel: {
                        value: 'test'
                    }
                }, values);

                this._super(values, parent, bind);
            },
            validate: function() {
                if (this.end < this.start) {
                    this.end = this.start;
                }
            }
        });
    });

    it("should have 'mymodel' registered as a model", function() {
        expect(Vizabi.Model._collection.hasOwnProperty('mymodel')).toBe(true);
    });

    it("should have correctly values after instantiation", function() {
        var t = new MyModel({
            value: '1900'
        });
        expect(t.value).toEqual('1900');
        expect(t.start).toEqual('1800');
        expect(t.end).toEqual('2015');
    });

    it("should not be loading if there's no hook", function() {
        var t = new MyModel({
            value: '1900'
        });
        expect(t.isLoading()).toBe(false);
    });

    describe("- Model events", function() {

        var events = [];

        beforeEach(function() {
            events = [];
        });

        it("should trigger init event for each field", function() {
            var t = new MyModel({}, null, {
                init: function(evt) {
                    events.push(evt);
                }
            });
            expect(events.length).toEqual(4); // 4 fields
            expect(events.indexOf("init:value")).not.toEqual(-1);
            expect(events.indexOf("init:start")).not.toEqual(-1);
            expect(events.indexOf("init:end")).not.toEqual(-1);
            expect(events.indexOf("init:submodel")).not.toEqual(-1);
        });

        it("should trigger one set event after instantiation", function() {
            var t = new MyModel({}, null, {
                set: function(evt) {
                    events.push(evt);
                }
            });
            expect(events.length).toEqual(1);
        });

        it("should trigger ready if nothing needs to be loaded", function() {
            var t = new MyModel({}, null, {
                ready: function(evt) {
                    events.push(evt);
                }
            });
            expect(events.length).toEqual(1);
        });

    });

    describe("- Model Validation", function() {

        it("should validate after setting a value", function() {
            var t = new MyModel({
                start: 2000,
                end: 1900
            });
            expect(t.start).toEqual(2000);
        });

    });

    describe("- Submodels", function() {

        var events = [];

        beforeEach(function() {
            events = [];
        });

        it("submodel values should be accessible", function() {
            var t = new MyModel({
                submodel: {
                    value: 'helloWorld'
                }
            });
            expect(t.submodel.value).toEqual('helloWorld');
        });

        it("should load the correct model if it's registered", function() {

            var Submodel = Vizabi.Model.extend({
                init: function(values, parent, bind) {
                    this._type = "submodel";
                    //default values for time model
                    values = Vizabi.utils.extend({
                        hello: 1,
                        world: [2, 3, 4]
                    }, values);

                    this._super(values, parent, bind);
                }
            });
            Vizabi.Model.register('submodel', Submodel);
            var t = new MyModel({});

            expect(t.submodel.getType()).toEqual('submodel');
            expect(t.submodel.hello).toEqual(1);
            expect(t.submodel.world[1]).toEqual(3);
        });

    });

});