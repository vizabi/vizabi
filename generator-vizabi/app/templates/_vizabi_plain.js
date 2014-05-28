define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var viz = new Vizabi(core, options);

        viz.name = '<%= _.slugify(vizabiName) %>';
        viz.setContainerClass('<%= _.slugify(vizabiName) %>');

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        viz.state = {
        
        };

        // The language of this visualization (*strongly suggested to exist*)
        viz.language = 'dev';

        viz.setLayout({
            desktop: {

            }
        });

        viz.start = function() {
            return this;
        };

        return viz;
    };

    return newVizabi;
});
