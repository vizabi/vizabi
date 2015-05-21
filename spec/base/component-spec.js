describe("* Base: Component", function() {

    var placeholder, utils, component, YearDisplay, MyComp;

    beforeAll(function() {
        initializeDOM();
        placeholder = document.getElementById("vzbp-placeholder");
        utils = Vizabi.utils;

        //create a new component fo ryear display and register
        YearDisplay = Vizabi.Component.extend({
            init: function(config, parent) {
                this.name = "year-display";
                this.template = "<h2><%= time %></h2>";
                this.template_data = {
                    time: "2012"
                };
                this._super(config, parent);
            }
        });

        //create a new component class
        MyComp = Vizabi.Component.extend({
            init: function(config, parent) {
                this.name = 'my_component';
                this.template = '<div><div class="display"></div></div>';
                this.components = [{
                    component: 'year-display',
                    placeholder: '.display',
                }];
                this._super(config, parent);
            }
        });
        //clear just in case
        Vizabi.Component.unregister('year-display');
        Vizabi.Component.register('year-display', YearDisplay);
    });

    it("should have year display registered as a component", function() {
        expect(Vizabi.Component._collection.hasOwnProperty('year-display')).toBe(true);
    });

    it("should render template in placeholder", function() {
        component = new YearDisplay({
            placeholder: placeholder
        });
        component.render();
        expect(placeholder.innerHTML).toEqual("<h2>2012</h2>");
    });


    describe("- Subcomponents", function() {

        it("should load and render subcomponents", function() {
            placeholder.innerHTML = '';
            component = new MyComp({
                placeholder: placeholder
            });
            component.render();
            expect(placeholder.innerHTML).toEqual('<div><div class="display"><h2>2012</h2></div></div>');
        });

    });

});