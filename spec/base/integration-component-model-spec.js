/*
 * TEST INTEGRATION BETWEEN COMPONENTS AND MODELS
 */

describe("* Base: Component-Model Integration", function() {

    var placeholder, utils, component, TimeModel, YearDisplay, MyComp;

    beforeAll(function() {

        initializeDOM();
        placeholder = document.getElementById("test-placeholder");
        utils = Vizabi.utils;

        //create a new component fo ryear display and register
        Vizabi.Model.unregister('time');
        TimeModel = Vizabi.Model.extend('time', {
            init: function(values, parent, bind) {
                this._type = "time";
                //default values for time model
                values = Vizabi.utils.extend({
                    value: "1800",
                    start: "1800",
                    end: "2015"
                }, values);

                this._super(values, parent, bind);
            }
        });

        //component expects a model
        YearDisplay = Vizabi.Component.extend({
            init: function(config, parent) {
                this.name = "year-display";
                this.template = "<h2><%= time %></h2>";
                this.model = new TimeModel();
                this.template_data = {
                    time: this.model.value
                };
                this._super(config, parent);

                var _this = this;
                this.model.on({
                    'change': function() {
                        _this.update()
                    }
                });
            },
            update: function(evt) {
                this.element.innerHTML = this.model.value;
            }
        });

    });

    describe("- Simple Model Integration", function() {

        it("should render model values", function() {
            placeholder.innerHTML = '';
            component = new YearDisplay({
                placeholder: placeholder
            });
            component.render();
            expect(placeholder.innerHTML).toEqual('<h2>1800</h2>');
        });

        it("should update when model changes", function() {
            placeholder.innerHTML = '';
            component = new YearDisplay({
                placeholder: placeholder
            });
            component.render();
            expect(placeholder.innerHTML).toEqual('<h2>1800</h2>');
            component.model.value = 2013;
            expect(placeholder.innerHTML).toEqual('<h2>2013</h2>');
        });

    });


    describe("- Model Integration with Subcomponents", function() {


        beforeAll(function() {

            Vizabi.Component.unregister('year-display');
            //component expects a model
            YearDisplay = Vizabi.Component.extend('year-display', {
                init: function(config, parent) {
                    this.name = "year-display";
                    this.template = "<h2></h2>";
                    this.model_expects = [{
                        name: 'time',
                        type: 'time'
                    }];
                    var _this = this;
                    this.model_binds = {
                        'change:time': function() {
                            _this.update()
                        }
                    };
                    this._super(config, parent);

                    this.on('ready', function() {
                        _this.update();
                    });
                },

                update: function(evt) {
                    this.element.innerHTML = this.model.time.value;
                }
            });


            MyComponent = Vizabi.Component.extend({
                init: function(config, parent) {
                    this.name = 'my_component';
                    this.template = '<div><div class="display"></div><div class="display2"></div></div>';
                    //generic model with TimeModel
                    this.model = new Vizabi.Model({
                        time_1: {
                            value: '1999'
                        },
                        time_2: {
                            value: '2000'
                        }
                    });
                    this.components = [{
                        component: 'year-display',
                        placeholder: '.display',
                        model: ['time_1']
                    }, {
                        component: 'year-display',
                        placeholder: '.display2',
                        model: ['time_2']
                    }];
                    this._super(config, parent);
                }
            });

        });

        it("should render model values", function() {
            placeholder.innerHTML = '';
            component = new MyComponent({
                placeholder: placeholder
            });
            component.render();
            expect(placeholder.innerHTML).toEqual('<div><div class="display"><h2>1999</h2></div><div class="display2"><h2>2000</h2></div></div>');
        });

        it("should update view when changing model", function() {
            component.model.time_1.value = 1840;
            expect(placeholder.innerHTML).toEqual('<div><div class="display"><h2>1840</h2></div><div class="display2"><h2>2000</h2></div></div>');

            component.model.time_2.value = 1880;
            expect(placeholder.innerHTML).toEqual('<div><div class="display"><h2>1840</h2></div><div class="display2"><h2>1880</h2></div></div>');
        });

    });

});