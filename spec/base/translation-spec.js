/*
 * TEST HOOKS, INTEGRATION OF BETWEEN TOOLS, MODELS AND DATA FETCHING
 */
//This test depends on models entities and time (not entirely self contained)
describe('* Base: Translation', function() {
    var placeholder;
    var utils;
    var t;
    var TimeModel;
    var InfoDisplay;
    var MyTool;
    var MyReader;
    var options_data;
    beforeAll(function(done) {
        initializeDOM();
        placeholder = document.getElementById('vzbp-placeholder');
        utils = Vizabi.utils;
        //create a new component fo info display and register
        Vizabi.Component.unregister('info-display');
        InfoDisplay = Vizabi.Component.extend('info-display', {
            init: function(config, parent) {
                this.name = 'info-display';
                this.template = '<div></div>';
                this.model_expects = [{
                    name: 'time',
                    type: 'time'
                }, {
                    name: 'label',
                    type: 'model'
                }, {
                    name: 'info',
                    type: 'model'
                }];
                var _this = this;
                this.model_binds = {
                    'change:time': function() {
                        _this.update();
                    },
                    'ready': function() {
                        _this.update();
                    }
                };
                this._super(config, parent);
            },
            update: function(evt) {
                var time = this.model.time.value;
                var items = this.model.label.getItems({
                    time: time
                });
                var html = '';
                for (var i in items) {
                    var d = items[i];
                    html += '<div>' + this.model.label.getValue(d) + '-' + this.model.info.getValue(d) + '</div>';
                }
                this.element.innerHTML = html;
            }
        });
        //create a new component class
        Vizabi.Tool.unregister('MyTool');
        MyTool = Vizabi.Tool.extend('MyTool', {
            init: function(placeholder, options) {
                this.name = 'MyTool';
                this.template = '<div><h2><%=t("title")%></h2><div class="display"></div></div>';
                this.components = [{
                    component: 'info-display',
                    placeholder: '.display',
                    model: [
                        'state.time',
                        'state.marker.label',
                        'state.marker.info'
                    ]
                }];
                //default options
                this.default_options = {
                    state: {
                        //timespan of the visualization
                        time: {
                            start: '1991',
                            end: '1994',
                            value: '1994'
                        },
                        //entities we want to show
                        entities: {
                            show: {
                                dim: 'geo',
                                filter: {
                                    _defs_: {
                                        'geo': ['*']
                                    }
                                }
                            }
                        },
                        //how we show it
                        marker: {
                            space: [
                                'entities',
                                'time'
                            ],
                            label: {
                                use: 'property',
                                which: 'name'
                            },
                            info: {
                                use: 'indicator',
                                which: 'pop'
                            }
                        }
                    },
                    data: {
                        reader: 'myreader'
                    },
                    ui: {
                        'displayColor': '#ffcc00'
                    },
                    //language properties
                    language: {
                        id: 'en',
                        strings: {
                            en: {
                                'title': 'Life Expectancy'
                            },
                            fr: {
                                'title': 'Esp\xE9rance de Vie'
                            }
                        }
                    }
                };
                this._super(placeholder, options);
            }
        });
        var data = [
            [{
                name: 'Sweden',
                geo: 'swe',
                time: '1991',
                pop: '1',
                lex: '30'
            }, {
                name: 'Sweden',
                geo: 'swe',
                time: '1992',
                pop: '2',
                lex: '31'
            }, {
                name: 'Sweden',
                geo: 'swe',
                time: '1993',
                pop: '3',
                lex: '32'
            }, {
                name: 'Sweden',
                geo: 'swe',
                time: '1994',
                pop: '4',
                lex: '33'
            }, {
                name: 'Norway',
                geo: 'nor',
                time: '1991',
                pop: '10',
                lex: '40'
            }, {
                name: 'Norway',
                geo: 'nor',
                time: '1992',
                pop: '20',
                lex: '41'
            }, {
                name: 'Norway',
                geo: 'nor',
                time: '1993',
                pop: '30',
                lex: '42'
            }, {
                name: 'Norway',
                geo: 'nor',
                time: '1994',
                pop: '40',
                lex: '43'
            }],
            [{
                name: 'Su\xE8de',
                geo: 'swe',
                time: '1991',
                pop: '1',
                lex: '30'
            }, {
                name: 'Su\xE8de',
                geo: 'swe',
                time: '1992',
                pop: '2',
                lex: '31'
            }, {
                name: 'Su\xE8de',
                geo: 'swe',
                time: '1993',
                pop: '3',
                lex: '32'
            }, {
                name: 'Su\xE8de',
                geo: 'swe',
                time: '1994',
                pop: '4',
                lex: '33'
            }, {
                name: 'Norv\xE8ge',
                geo: 'nor',
                time: '1991',
                pop: '10',
                lex: '40'
            }, {
                name: 'Norv\xE8ge',
                geo: 'nor',
                time: '1992',
                pop: '20',
                lex: '41'
            }, {
                name: 'Norv\xE8ge',
                geo: 'nor',
                time: '1993',
                pop: '30',
                lex: '42'
            }, {
                name: 'Norv\xE8ge',
                geo: 'nor',
                time: '1994',
                pop: '40',
                lex: '43'
            }]
        ];
        //create a new component fo ryear display and register
        Vizabi.Reader.unregister('myreader');
        MyReader = Vizabi.Reader.extend('myreader', {
            init: function(reader_info) {
                this.name = 'myreader';
                this._super(reader_info);
                //hack to format objects
                data[0] = Vizabi.utils.mapRows(data[0], this._formatters);
                data[1] = Vizabi.utils.mapRows(data[1], this._formatters);
            },
            read: function(query, language) {
                var index = language === 'en' ? 0 : 1;
                var p = new Vizabi.Promise();
                var _this = this;
                setTimeout(function() {
                    _this._data = data[index];
                    p.resolve(); //simulate async reading
                }, 500);
                return p;
            }
        });
        t = Vizabi('MyTool', placeholder, {
            data: options_data,
            bind: {
                'ready': function() {
                    done();
                }
            }
        });
    });
    it('should initialize tool', function() {
        expect(Vizabi.Tool.isTool(t)).toBe(true);
    });
    it('should render tool with correct info', function() {
        expect(placeholder.innerHTML).toContain('<div>Sweden-4</div><div>Norway-40</div>');
    });
    it('should change view instantaneously if nothing needs to be loaded (year changed)', function() {
        t.model.state.time.value = '1993';
        expect(placeholder.innerHTML).toContain('<div>Sweden-3</div><div>Norway-30</div>');
        t.model.state.time.value = '1992';
        expect(placeholder.innerHTML).toContain('<div>Sweden-2</div><div>Norway-20</div>');
    });
    describe('- Changing Language', function() {
        beforeAll(function(done) {
            t.on('ready', function() {
                setTimeout(function() {
                    done();
                }, 500);
            });
            t.setOptions({
                language: {
                    id: 'fr'
                }
            });
        });
        it('should have changed data text', function() {
            expect(placeholder.innerHTML).toContain('<div>Su\xE8de-2</div><div>Norv\xE8ge-20</div>');
        });
        it('should have changed template text', function() {
            expect(placeholder.innerHTML).toContain('Esp\xE9rance de Vie');
        });
    });
});