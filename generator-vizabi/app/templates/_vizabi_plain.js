define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var <%= _.slugify(vizabiName) %> = new Vizabi(core, options);

        <%= _.slugify(vizabiName) %>.name = '<%= _.slugify(vizabiName) %>';
        <%= _.slugify(vizabiName) %>.setContainerClass('<%= _.slugify(vizabiName) %>');

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        <%= _.slugify(vizabiName) %>.state = {
        
        };

        // The language of this visualization (*strongly suggested to exist*)
        <%= _.slugify(vizabiName) %>.language = 'dev';

        <%= _.slugify(vizabiName) %>.setLayout({
            desktop: {

            }
        });

        <%= _.slugify(vizabiName) %>.start = function() {
            return this;
        };

        return <%= _.slugify(vizabiName) %>;
    };

    return newVizabi;
});
