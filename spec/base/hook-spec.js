/*
 * TEST HOOKS, INTEGRATION OF BETWEEN TOOLS, MODELS AND DATA FETCHING
 */

//This test depends on models entities and time (not entirely self contained)

describe("* Base: Hooks", function() {

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
        placeholder = document.getElementById("vzbp-placeholder");
        utils = Vizabi.utils;

        //create a new component fo info display and register
        Vizabi.Component.unregister('info-display');
        InfoDisplay = Vizabi.Component.extend('info-display', {
            init: function(config, parent) {
                this.name = "info-display";
                this.template = "<div></div>";
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
                var html = "";
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
                this.template = '<div><div class="display"></div></div>';
                this.components = [{
                    component: 'info-display',
                    placeholder: '.display',
                    model: ['state.time', 'state.marker.label',
                        'state.marker.info'
                    ]
                }];

                //default options
                this.default_options = {
                    state: {
                        _type_: "model",
                        _defs_: {
                            //timespan of the visualization
                            time: {
                                _type_: "model",
                                _defs_: {
                                    start: "1991",
                                    end: "1994",
                                    value: "1994"
                                }
                            },
                            //entities we want to show
                            entities: {
                                _type_: "model",
                                _defs_: {
                                    show: {
                                        _type_: "model",
                                        _defs_: {
                                            dim: {
                                                _type_: "string",
                                                _defs_: "geo"
                                            },
                                            filter: {
                                                _type_: "object",
                                                _defs_: {
                                                    "geo": ["*"]
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            //how we show it
                            marker: {
                                _type_: "model",
                                _defs_: {
                                    dimensions: {
                                        _type_: "array",
                                        _defs_: ["entities", "time"]
                                    },
                                    label: {
                                        _type_: "hook",
                                        _defs_: {
                                            use: {
                                                _type_: "string",
                                                _defs_: "property",
                                                _opts_: ["property", "indicator", "value"]
                                            },
                                            which: {
                                                _type_: "string",
                                                _defs_: "geo"
                                            }
                                        }
                                    },
                                    info: {
                                        _type_: "hook",
                                        _defs_: {
                                            use: {
                                                _type_: "string",
                                                _defs_: "indicator",
                                                _opts_: ["property", "indicator", "value"]
                                            },
                                            which: {
                                                _type_: "string",
                                                _defs_: "pop"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },

                    data: {
                        _type_: "model",
                        _defs_: {
                            reader: {
                                _type_: "string",
                                _defs_: "myreader"
                            }
                        }
                    },

                    ui: {
                        _type_: "model",
                        _defs_: {
                            'displayColor': {
                                _type_: "string",
                                _defs_: "#ffcc00"
                            }
                        }
                    },

                    //language properties
                    language: {
                        _type_: "model",
                        _defs_: {
                            id: {
                                _type_: "string",
                                _defs_: "en"
                            },
                            strings: {
                                _type_: "object",
                                _defs_: {
                                    en: {
                                        "title": "Information"
                                    }
                                }
                            }
                        }
                    }
                };

                this._super(placeholder, options);
            }
        });

        //create a new component fo ryear display and register
        Vizabi.Reader.unregister('myreader');
        MyReader = Vizabi.Reader.extend('myreader', {
            init: function(reader_info) {
                this.name = "myreader";
                this._super(reader_info);
            },
            read: function() {
                var p = new Vizabi.Promise;
                setTimeout(function() {
                    p.resolve(); //simulate async reading
                }, 500);
                return p;
            }
        });

        var options_data = {
            reader: 'myreader',
            data: [{
                geo: "swe",
                time: "1991",
                pop: "1",
                lex: "30"
            }, {
                geo: "swe",
                time: "1992",
                pop: "2",
                lex: "31"
            }, {
                geo: "swe",
                time: "1993",
                pop: "3",
                lex: "32"
            }, {
                geo: "swe",
                time: "1994",
                pop: "4",
                lex: "33"
            }, {
                geo: "nor",
                time: "1991",
                pop: "10",
                lex: "40"
            }, {
                geo: "nor",
                time: "1992",
                pop: "20",
                lex: "41"
            }, {
                geo: "nor",
                time: "1993",
                pop: "30",
                lex: "42"
            }, {
                geo: "nor",
                time: "1994",
                pop: "40",
                lex: "43"
            }]
        };

        t = Vizabi('MyTool', placeholder, {
            data: options_data,
            bind: {
                'ready': function() {
                    done();
                }
            }
        });

    });

    it("should initialize tool", function() {
        expect(Vizabi.Tool.isTool(t)).toBe(true);
    });

    it("should render tool with correct info", function() {
        expect(placeholder.innerHTML).toContain('<div>swe-4</div><div>nor-40</div>');
    });

    it("should change view instantaneously if nothing needs to be loaded (year changed)", function() {
        t.model.state.time.value = "1993";
        expect(placeholder.innerHTML).toContain('<div>swe-3</div><div>nor-30</div>');
        t.model.state.time.value = "1992";
        expect(placeholder.innerHTML).toContain('<div>swe-2</div><div>nor-20</div>');
    });

    describe("- Changing Hooks", function() {

        beforeAll(function(done) {

            t.on('ready', function() {
                //make sure done is called one frame after update
                setTimeout(function() {
                    done();
                }, 1);
            });

            t.setOptions({
                state: {
                    marker: {
                        info: {
                            which: 'lex'
                        }
                    }
                }
            });
        });

        it("should have changed indicator values", function() {
            expect(placeholder.innerHTML).toContain('<div>swe-31</div><div>nor-41</div>');
        });

    });

});