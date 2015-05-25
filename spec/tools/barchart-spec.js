describe("* Tool: Bar Chart", function() {

    var placeholder, utils, tool;

    beforeAll(function() {
        initializeDOM();
        placeholder = document.getElementById("vzbp-placeholder");
        utils = Vizabi.utils;

        tool = Vizabi('BarChart', placeholder);

    });

    it("should render barchart correctly in placeholder", function() {
        var bc = placeholder.querySelector('.vzb-tool-bar-chart');
        expect(bc.innerHTML).toEqual("<h3></h3>");
    });

});