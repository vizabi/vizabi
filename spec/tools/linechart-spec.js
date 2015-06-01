describe("* Tool: Line Chart", function() {

    var placeholder, utils, tool;

    beforeAll(function(done) {
        initializeDOM();
        placeholder = document.getElementById("vzbp-placeholder");
        utils = Vizabi.utils;

        tool = Vizabi('LineChart', placeholder, {
            bind: {
                'ready': function() {
                    setTimeout(function() {
                        done();
                    }, 100);
                }
            }
        });

    });

    it("should render line chart correctly in placeholder", function() {
        var bc = placeholder.querySelectorAll('.vzb-lc-lines');
        expect(bc.length > 0).toBeTruthy();
    });

    //TODO: Testing for detailed features, interaction, etc

});