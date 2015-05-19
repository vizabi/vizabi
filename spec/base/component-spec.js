describe("* Base: Component", function() {

    initializeDOM();
    var placeholder = document.getElementById("test-placeholder");
    var utils = Vizabi.utils;

    //create a new component fo ryear display and register
    var YearDisplay = Vizabi.Component.extend({
        init: function(config, parent) {
            this.name = "year-display";
            this.template = "<h2><%= time %></h2>";
            this.template_data = {
                time: "2012"
            };
            this._super(config, parent);
        }
    });
    Vizabi.registerComponent('year-display', YearDisplay);

    //create a new component class
    var MyComp = Vizabi.Component.extend({
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
    var component;

    it("should have year display registered as a component", function() {
        expect(Vizabi._components.hasOwnProperty('year-display')).toBe(true);
    });

    it("should render template in placeholder", function() {
        component = new YearDisplay({
            placeholder: placeholder
        });
        component.render();
        expect(placeholder.innerHTML).toEqual("<h2>2012</h2>");
    });


    describe("load subcomponents", function() {

        it("should load and render subcomponents", function() {
            placeholder.innerHTML = '';
            component = new MyComp({
                placeholder: placeholder
            });
            component.render();
            expect(placeholder.innerHTML).toEqual('<div><div class="display vzb-loading"><h2>2012</h2></div></div>');
        });

    });

});