describe("* Base: Class", function() {

    var Animal = Vizabi.Class.extend({
        init: function() {
            this.alive = true;
        },
        move: function() {
            return "It is moving";
        }
    });

    var Dog = Animal.extend({
        init: function() {
            this.barking = true;
            this._super();
        }
    });

    var doug = new Dog();

    it("should be extendable", function() {
        expect(doug.barking).toBe(true);
        expect(doug.move()).toEqual("It is moving");
    });

    it("should be able to call super's method", function() {
        expect(doug.alive).toBe(true);
    });

});