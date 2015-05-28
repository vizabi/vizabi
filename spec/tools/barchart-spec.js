describe("* Tool: Bar Chart", function() {

    var placeholder, utils, tool;

    beforeAll(function(done) {
        initializeDOM();
        placeholder = document.getElementById("vzbp-placeholder");
        utils = Vizabi.utils;

        tool = Vizabi('BarChart', placeholder, {
            bind: {
                'ready': function() {
                    setTimeout(function() {
                        done();
                    }, 100);
                }
            }
        });

    });

    it("should render barchart correctly in placeholder", function() {
        var bc = placeholder.querySelector('.vzb-tool-bar-chart');
        expect(bc.innerHTML).toContain('<svg class="vzb-bar-chart">');
    });

});