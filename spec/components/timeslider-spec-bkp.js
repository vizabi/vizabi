describe('* Component: Timeslider', function() {
    var placeholder;
    var utils;
    var MyTool;
    var tool;
    beforeAll(function() {
        initializeDOM();
        placeholder = document.getElementById('vzbp-placeholder');
        utils = Vizabi.utils;
        Vizabi.Tool.unregister('MyTool');
        MyTool = Vizabi.Tool.extend('MyTool', {
            init: function(placeholder, options) {
                this.name = 'MyTool';
                this.components = [{
                    component: 'gapminder-timeslider',
                    placeholder: '.vzb-tool-timeslider',
                    model: ['time']
                }];
                this._super(placeholder, options);
            },
            //dont preload anything
            preload: function(promise) {
                promise.resolve();
            }
        });
        tool = Vizabi('MyTool', placeholder, {
            time: {
                value: '1952',
                speed: 50
            }
        });
    });
    it('should render timeslider correctly with a model', function() {
        var tsPlaceholder = placeholder.querySelector('.vzb-tool-timeslider');
        var tsElement = tsPlaceholder.querySelector('.vzb-timeslider');
        expect(tsPlaceholder).not.toBe(null);
        expect(tsElement).not.toBe(null);
    });
    it('should have correct value', function() {
        var tsHtmlValue = placeholder.querySelector('.vzb-ts-slider-value');
        expect(tsHtmlValue.textContent).toEqual('1952');
    });
    it('should react to model changes', function() {
        var tsHtmlValue = placeholder.querySelector('.vzb-ts-slider-value');
        tool.setOptions({
            time: {
                value: '1990'
            }
        });
        expect(tsHtmlValue.textContent).toEqual('1990');
    });
    describe('- Multiple timesliders, same model', function() {
        var ts1;
        var ts2;
        var ts3;
        beforeAll(function() {
            placeholder.innerHTML = '';
            Vizabi.Tool.unregister('MyTool');
            Vizabi.Tool.extend('MyTool', {
                init: function(placeholder, options) {
                    this.name = 'MyTool';
                    this.template = '<div class="vzb-tool"><div class="vzb-tool-ts1"></div><div class="vzb-tool-ts2"></div><div class="vzb-tool-ts3"></div></div>';
                    this.components = [{
                        component: 'gapminder-timeslider',
                        placeholder: '.vzb-tool-ts1',
                        model: ['time']
                    }, {
                        component: 'gapminder-timeslider',
                        placeholder: '.vzb-tool-ts2',
                        model: ['time']
                    }, {
                        component: 'gapminder-timeslider',
                        placeholder: '.vzb-tool-ts3',
                        model: ['time']
                    }];
                    this._super(placeholder, options);
                }
            });
            tool = Vizabi('MyTool', placeholder, {
                time: {
                    value: '1952'
                }
            });
            var p = placeholder;
            ts1 = p.querySelector('.vzb-tool-ts1 .vzb-ts-slider-value');
            ts2 = p.querySelector('.vzb-tool-ts2 .vzb-ts-slider-value');
            ts3 = p.querySelector('.vzb-tool-ts3 .vzb-ts-slider-value');
        });
        it('should have correct value in all time sliders', function() {
            expect(ts1.textContent).toEqual('1952');
            expect(ts2.textContent).toEqual('1952');
            expect(ts3.textContent).toEqual('1952');
        });
        describe('- Interaction: play', function() {
            beforeEach(function(done) {
                tool.setOptions({
                    time: {
                        value: '2000',
                        end: '2010',
                        speed: 50,
                        playing: true
                    }
                });
                setTimeout(function() {
                    done();
                }, 1000);
            });
            it('should have played', function() {
                expect(ts1.textContent).toEqual('2010');
                expect(ts2.textContent).toEqual('2010');
                expect(ts3.textContent).toEqual('2010');
            });
        });
    });
    describe('- Multiple timesliders, multiple models, with validation', function() {
        var ts1;
        var ts2;
        var ts3;
        beforeAll(function() {
            placeholder.innerHTML = '';
            Vizabi.Tool.unregister('MyTool');
            Vizabi.Tool.extend('MyTool', {
                init: function(placeholder, options) {
                    this.name = 'MyTool';
                    this.template = '<div class="vzb-tool"><div class="vzb-tool-ts1"></div><div class="vzb-tool-ts2"></div><div class="vzb-tool-ts3"></div></div>';
                    this.components = [{
                        component: 'gapminder-timeslider',
                        placeholder: '.vzb-tool-ts1',
                        model: ['state.time_start']
                    }, {
                        component: 'gapminder-timeslider',
                        placeholder: '.vzb-tool-ts2',
                        model: ['state.time_end']
                    }, {
                        component: 'gapminder-timeslider',
                        placeholder: '.vzb-tool-ts3',
                        model: ['state.time']
                    }];
                    this._super(placeholder, options);
                },
                validate: function() {
                    //TODO: remove validation hotfix
                    //while setting this.model is not available
                    var m = this.model || arguments[0];
                    var state = m.state;
                    if (state.time_end.start !== state.time_start.value) {
                        state.time_end.start = state.time_start.value;
                    }
                    if (state.time.start !== state.time_start.value) {
                        state.time.start = state.time_start.value;
                    }
                    if (state.time.end !== state.time_end.value) {
                        state.time.end = state.time_end.value;
                    }
                }
            });
            tool = Vizabi('MyTool', placeholder, {
                state: {
                    time_start: {
                        speed: 50,
                        value: '2000'
                    },
                    time_end: {
                        speed: 50,
                        value: '2010'
                    },
                    time: {
                        speed: 50,
                        value: '2005'
                    }
                }
            });
            var p = placeholder;
            ts1 = p.querySelector('.vzb-tool-ts1 .vzb-ts-slider-value');
            ts2 = p.querySelector('.vzb-tool-ts2 .vzb-ts-slider-value');
            ts3 = p.querySelector('.vzb-tool-ts3 .vzb-ts-slider-value');
        });
        it('should have correct values in all time sliders', function() {
            expect(ts1.textContent).toEqual('2000');
            expect(ts2.textContent).toEqual('2010');
            expect(ts3.textContent).toEqual('2005');
        });
        it('should change values according to validation rule', function() {
            tool.setOptions({
                state: {
                    time_start: {
                        value: '2010'
                    },
                    time_end: {
                        value: '2014'
                    }
                }
            });
            expect(ts3.textContent).toEqual('2010');
        });
    });
});