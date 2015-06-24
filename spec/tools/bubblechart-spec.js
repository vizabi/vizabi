describe('* Tool: Bubble Chart', function() {
    var placeholder;
    var utils;
    var tool;
    beforeAll(function(done) {
        initializeDOM();
        placeholder = document.getElementById('vzbp-placeholder');
        utils = Vizabi.utils;
        tool = Vizabi('BubbleChart', placeholder, {
            bind: {
                'ready': function() {
                    setTimeout(function() {
                        done();
                    }, 100);
                }
            }
        });
    });
    it('should render bubble chart correctly in placeholder', function() {
        var bc = placeholder.querySelectorAll('.vzb-bc-bubbles');
        expect(bc.length > 0).toBeTruthy();
    }); //TODO: Testing for detailed features, interaction, etc
});