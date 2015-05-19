describe("* Base: Layout", function() {

    initializeDOM();
    var placeholder = document.getElementById("test-placeholder");
    var utils = Vizabi.utils;
    var layout;
    
    beforeEach(function() {
        layout = new Vizabi.Layout();
        layout.setContainer(placeholder);
    });

    it("should add correct classes for orientation", function() {
        placeholder.style.width = "300px";
        placeholder.style.height = "400px";
        layout.setSize();
        expect(utils.hasClass(placeholder, 'vzb-portrait')).toBe(true);
        expect(utils.hasClass(placeholder, 'vzb-landscape')).toBe(false);

        placeholder.style.width = "400px";
        placeholder.style.height = "300px";
        layout.setSize();
        expect(utils.hasClass(placeholder, 'vzb-portrait')).toBe(false);
        expect(utils.hasClass(placeholder, 'vzb-landscape')).toBe(true);
    });

    it("should add correct classes for small screens", function() {
        placeholder.style.width = "300px";
        placeholder.style.height = "400px";
        layout.setSize();
        expect(utils.hasClass(placeholder, 'vzb-small')).toBe(true);
        expect(utils.hasClass(placeholder, 'vzb-medium')).toBe(false);
        expect(utils.hasClass(placeholder, 'vzb-large')).toBe(false);
    });

    it("should add correct classes for medium screens", function() {
        placeholder.style.width = "800px";
        placeholder.style.height = "600px";
        layout.setSize();
        expect(utils.hasClass(placeholder, 'vzb-small')).toBe(false);
        expect(utils.hasClass(placeholder, 'vzb-medium')).toBe(true);
        expect(utils.hasClass(placeholder, 'vzb-large')).toBe(false);
    });

    it("should add correct classes for large screens", function() {
        placeholder.style.width = "1200px";
        placeholder.style.height = "800px";
        layout.setSize();
        expect(utils.hasClass(placeholder, 'vzb-small')).toBe(false);
        expect(utils.hasClass(placeholder, 'vzb-medium')).toBe(false);
        expect(utils.hasClass(placeholder, 'vzb-large')).toBe(true);
    });
});