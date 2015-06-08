describe("* Base: Data", function() {

    var utils, MyReader, results;
    utils = Vizabi.utils;

    //create a new component fo ryear display and register
    MyReader = Vizabi.Reader.extend('myreader', {
        init: function(reader_info) {
            this.name = "myreader";
            this._super(reader_info);
        },
        read: function() {
            var p = new Vizabi.Promise;
            setTimeout(function() {
                p.resolve(); //simulate async reading
            }, 500);
            return p;
        }
    });

    var options_data = {
        reader: 'myreader',
        data: [{
            geo: "swe",
            time: "1996",
            pop: "12345"
        }, {
            geo: "swe",
            time: "1992",
            pop: "12345"
        }]
    };

    describe("- Reader", function() {

        beforeAll(function(done) {

            var r = new MyReader(options_data);

            r.read().then(function() {
                results = r.getData();
                done();
            });

        });

        it("should register a new reader", function() {
            expect(Vizabi.Reader._collection.hasOwnProperty('myreader')).toBe(true);
        });

        it("read data from reader", function() {
            expect(results.length).toBeGreaterThan(0);
        });

    });

    describe("- Data Manager", function() {

        var dataMan;
        var query = {
            from: "humnum",
            select: ["geo", "time"],
            where: {
                "geo": ["swe"]
            }
        };

        beforeAll(function(done) {

            results = [];
            dataMan = new Vizabi.Data();
            dataMan.load(query, "en", options_data).then(function(data) {
                results = data;
                done();
            });

        });

        it("should have correct results", function() {
            expect(results.length).toBeGreaterThan(0);
        });

        it("should have result cached", function() {
            expect(Object.keys(dataMan._collection).length).toEqual(1);
        });

    });

});