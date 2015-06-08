//This test depends on models entities and time

describe("* Misc: HTML5 Support ", function() {

    var placeholder;
    var utils;
    var t;
    var pie;
    var PieChart;
    var options_data;

    var pieColors = ['rgba(119, 146, 174, 0.7)', 'rgb(236, 208, 120)', 'rgba(217, 91, 67, 0.7)', 'rgba(192, 41, 66, 0.7)', 'rgba(83, 119, 122, 0.7)', 'rgba(84, 36, 55, 0.7)'];

    beforeAll(function(done) {

        initializeDOM();
        placeholder = document.getElementById("vzbp-placeholder");
        utils = Vizabi.utils;

        //create a new component fo info display and register
        Vizabi.Component.unregister('pie-chart');
        pie = Vizabi.Component.extend('pie-chart', {
            init: function(config, parent) {
                this.name = "info-display";
                this.template = "<canvas></canvas>";
                this.model_expects = [{
                    name: 'time',
                    type: 'time'
                }, {
                    name: 'marker',
                    type: 'model'
                }];
                var _this = this;
                this.model_binds = {
                    'change:time': function() {
                        _this.draw();
                    }
                };
                this._super(config, parent);
            },

            ready: function() {
                this.draw();
            },

            resize: function() {
                this.element.width = this.placeholder.clientWidth;
                this.element.height = this.placeholder.clientHeight;
                this.draw();
            },

            draw: function(evt) {

                this.element.width = this.placeholder.clientWidth;
                this.element.height = this.placeholder.clientHeight;

                function getTotal(arr) {
                    var j,
                        myTotal = 0;

                    for (j = 0; j < arr.length; j++) {
                        myTotal += (typeof arr[j] === 'number') ? arr[j] : 0;
                    }

                    return myTotal;
                }

                var info = this.model.marker.info;
                var curr_time = this.model.time.value;
                var i,
                    canvas = this.element,
                    pieData = info.getItems({ time: curr_time }).map(function(d) {
                        return parseInt(info.getValue(d), 10)
                    }),
                    halfWidth = canvas.width * .5,
                    halfHeight = canvas.height * .5,
                    ctx = canvas.getContext('2d'),
                    lastend = 0,
                    myTotal = getTotal(pieData);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (i = 0; i < pieData.length; i++) {
                    ctx.fillStyle = pieColors[i];
                    ctx.beginPath();
                    ctx.moveTo(halfWidth, halfHeight);
                    ctx.arc(halfWidth, halfHeight, halfHeight, lastend, lastend + (Math.PI * 2 * (pieData[i] / myTotal)), false);
                    ctx.lineTo(halfWidth, halfHeight);
                    ctx.fill();
                    lastend += Math.PI * 2 * (pieData[i] / myTotal);
                }
            }
        });

        //create a new component class
        Vizabi.Tool.unregister('PieChart');
        PieChart = Vizabi.Tool.extend('PieChart', {
            init: function(placeholder, options) {
                this.name = 'PieChart';
                this.components = [{
                    component: 'pie-chart',
                    placeholder: '.vzb-tool-viz',
                    model: ['state.time', 'state.marker']
                }, {
                    component: 'gapminder-timeslider',
                    placeholder: '.vzb-tool-timeslider',
                    model: ['state.time']
                }];

                //default options
                this.default_options = {
                    state: {
                        //timespan of the visualization
                        time: {
                            start: "1991",
                            end: "1994",
                            value: "1994"
                        },
                        //entities we want to show
                        entities: {
                            show: {
                                dim: "geo",
                                filter: {
                                    _defs_: {
                                        "geo": ["*"]
                                    }
                                }
                            }
                        },
                        //how we show it
                        marker: {
                            space: ["entities", "time"],
                            label: {
                                use: "property",
                                which: "geo"
                            },
                            info: {
                                use: "indicator",
                                which: "pop"
                            }
                        }
                    },

                    data: {
                        reader: "myreader"
                    },

                    //language properties
                    language: {
                        id: "en",
                        strings: {
                            en: {
                                "title": "Information"
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
            }, {
                geo: "fin",
                time: "1991",
                pop: "40",
                lex: "80"
            }, {
                geo: "fin",
                time: "1992",
                pop: "42",
                lex: "81"
            }, {
                geo: "fin",
                time: "1993",
                pop: "45",
                lex: "82"
            }, {
                geo: "fin",
                time: "1994",
                pop: "50",
                lex: "83"
            }]
        };

        t = Vizabi('PieChart', placeholder, {
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

    it("should render tool", function() {
        expect(placeholder.innerHTML).toContain('</canvas>');
    });

});