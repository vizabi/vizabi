describe('* Tool: Bubble Chart', function() {
    var placeholder;
    var utils;
    var tool;
    beforeAll(function(done) {
        initializeDOM();
        placeholder = document.getElementById('vzbp-placeholder');
        utils = Vizabi.utils;
        tool = Vizabi('BubbleChart', placeholder, {
            bind: {
                'ready': function() {
                    setTimeout(function() {
                        done();
                    }, 100);
                }
            },
            state: {
            time: {
                start: "1990",
                end: "2014",
                value: "2000"
            },
            marker: {
                space: ["entities", "time"],
                type: "geometry",
                shape: "circle",
                label: {
                    use: "property",
                    which: "geo.name"
                },
                axis_y: {
                    use: "indicator",
                    which: "lex",
                    scaleType: "linear"
                },
                axis_x: {
                    use: "indicator",
                    which: "gdp_per_cap",
                    scaleType: "log"
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                },
                size: {
                    use: "indicator",
                    which: "pop",
                    scaleType: "linear",
                    min: 0,
                    max: 0.75
                }
            }
        },
            data: {
                reader: "inline",
                data: [ {
                            "time": new Date("1990"),
                            "geo": "chn",
                            "gdp_per_cap": "1968.25",
                            "lex": "69.45",
                            "pop": "1145195235",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1991"),
                            "geo": "chn",
                            "gdp_per_cap": "2062.03",
                            "lex": "69.63",
                            "pop": "1160799513",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1992"),
                            "geo": "chn",
                            "gdp_per_cap": "2214.96",
                            "lex": "69.80",
                            "pop": "1175230317",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1993"),
                            "geo": "chn",
                            "gdp_per_cap": "2456.94",
                            "lex": "69.96",
                            "pop": "1188687531",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1994"),
                            "geo": "chn",
                            "gdp_per_cap": "2644.76",
                            "lex": "70.11",
                            "pop": "1201522573",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1995"),
                            "geo": "chn",
                            "gdp_per_cap": "2949.55",
                            "lex": "70.29",
                            "pop": "1213986610",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1996"),
                            "geo": "chn",
                            "gdp_per_cap": "3020.26",
                            "lex": "70.52",
                            "pop": "1226134421",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1997"),
                            "geo": "chn",
                            "gdp_per_cap": "3178.44",
                            "lex": "70.83",
                            "pop": "1237849863",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1998"),
                            "geo": "chn",
                            "gdp_per_cap": "3123.28",
                            "lex": "71.20",
                            "pop": "1249020149",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("1999"),
                            "geo": "chn",
                            "gdp_per_cap": "3250.64",
                            "lex": "71.64",
                            "pop": "1259476972",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2000"),
                            "geo": "chn",
                            "gdp_per_cap": "3407.51",
                            "lex": "72.12",
                            "pop": "1269116733",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2001"),
                            "geo": "chn",
                            "gdp_per_cap": "3619.42",
                            "lex": "72.60",
                            "pop": "1277903626",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2002"),
                            "geo": "chn",
                            "gdp_per_cap": "3989.68",
                            "lex": "73.06",
                            "pop": "1285933795",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2003"),
                            "geo": "chn",
                            "gdp_per_cap": "4292.34",
                            "lex": "73.46",
                            "pop": "1293396654",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2004"),
                            "geo": "chn",
                            "gdp_per_cap": "4706.03",
                            "lex": "73.79",
                            "pop": "1300552134",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2005"),
                            "geo": "chn",
                            "gdp_per_cap": "5152.28",
                            "lex": "74.05",
                            "pop": "1307593484",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2006"),
                            "geo": "chn",
                            "gdp_per_cap": "5760.84",
                            "lex": "74.25",
                            "pop": "1314581407",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2007"),
                            "geo": "chn",
                            "gdp_per_cap": "6374.65",
                            "lex": "74.41",
                            "pop": "1321481933",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2008"),
                            "geo": "chn",
                            "gdp_per_cap": "6481.59",
                            "lex": "74.57",
                            "pop": "1328275525",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2009"),
                            "geo": "chn",
                            "gdp_per_cap": "6932.74",
                            "lex": "74.71",
                            "pop": "1334908824",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2010"),
                            "geo": "chn",
                            "gdp_per_cap": "7405.72",
                            "lex": "74.86",
                            "pop": "1341335156",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2011"),
                            "geo": "chn",
                            "gdp_per_cap": "7781.36",
                            "lex": "75.02",
                            "pop": "1347565324",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2012"),
                            "geo": "chn",
                            "gdp_per_cap": "8346.86",
                            "lex": "75.17",
                            "pop": "1353600687",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2013"),
                            "geo": "chn",
                            "gdp_per_cap": "8973.24",
                            "lex": "75.33",
                            "pop": "1359368470",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }, {
                            "time": new Date("2014"),
                            "geo": "chn",
                            "gdp_per_cap": "9664.71",
                            "lex": "75.48",
                            "pop": "1364773138",
                            "geo.name": "China",
                            "geo.region": "asi",
                            "geo.cat": ["country"]
                        }]
            }
        });
    });
    it('should render bubble chart correctly in placeholder', function() {
        var bc = placeholder.querySelectorAll('.vzb-bc-bubbles');
        expect(bc.length > 0).toBeTruthy();
    }); //TODO: Testing for detailed features, interaction, etc
});