define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var <%= _.camelize(vizabiName) %> = new Vizabi(core, options);

        <%= _.camelize(vizabiName) %>.name = '<%= _.slugify(vizabiName) %>';
        <%= _.camelize(vizabiName) %>.getSVG().classed('<%= _.slugify(vizabiName) %>', true);

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        <%= _.camelize(vizabiName) %>.state = {
        
        };

        // The language of this visualization (*strongly suggested to exist*)
        <%= _.camelize(vizabiName) %>.language = 'dev';

        <%= _.camelize(vizabiName) %>.setLayout({
            desktop: {

            }
        });

        <%= _.camelize(vizabiName) %>.start = function() {
            return this;
        };

        return <%= _.camelize(vizabiName) %>;
    };

    return newVizabi;
});
