/*!
 * VIZABI GAPMINDER PREFERENCES (included only in Gapminder build)
 */

import globals from 'base/globals';
import * as utils from 'base/utils';
import Promise from 'base/promise';
import Tool from 'base/tool';
import Vzb from 'vizabi';

//import tools
import BubbleChart from 'tools/bubblechart';
import BarRankChart from 'tools/barrankchart';
import MountainChart from 'tools/mountainchart';
import MCComponent from 'tools/mountainchart-component';
import BarChart from 'tools/barchart';
import BubbleMap from 'tools/bubblemap';
import BMComponent from 'tools/bubblemap-component';
import LineChart from 'tools/linechart';
import PopByAge from 'tools/popbyage';

//waffle reader
import {
  waffle as WaffleReader
}
from 'readers/_index';

var language = {
  id: "en",
  strings: {}
};

var locationArray = window.location.href.split("/");
var localUrl = locationArray.splice(0, locationArray.indexOf("preview")).join("/");
localUrl += "/preview/";
var onlineUrl = "http://static.gapminderdev.org/vizabi/develop/preview/";

//TODO: remove hardcoded path from source code
globals.gapminder_paths = {
  baseUrl: localUrl
};

//OVERWRITE OPTIONS

BarChart.define('default_options', {
  state: {
    time: {
      start: "1800",
      end: "2012",
      value: "2000",
      step: 1,
      formatInput: "%Y"
    },
    entities: {
      dim: "geo",
      show: {
        _defs_: {
          "geo": ["usa", "swe", "nor"],
          "geo.cat": ["country"]
        }
      }
    },
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "geo.name"
      },
      axis_y: {
        use: "indicator",
        which: "pop",
        scaleType: "log",
        allow: {
          scales: ["linear", "log"]
        }
      },
      axis_x: {
        use: "property",
        which: "geo.name",
        allow: {
          scales: ["ordinal"],
          names: ["!geo", "!_default"]
        }
      },
      color: {
        use: "property",
        which: "geo.region",
        scaleType: "ordinal"
      }
    }
  },
  data: {
    reader: "csv",
    path: globals.gapminder_paths.baseUrl + "data/waffles/dont-panic-poverty.csv"
  },
  language: language,
  ui: {
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},
    presentation: false
  }
});

BarRankChart.define('default_options', {
  state: {
    time: {
      start: "1800",
      end: "2015",
      value: "2000",
      step: 1,
      formatInput: "%Y"
    },
    entities: {
      dim: "geo",
      show: {
        _defs_: {
          "geo.cat": ["country"]
        }
      },
      opacitySelectDim: .3,
      opacityRegular: 1
    },
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "geo.name"
      },
      axis_x: {
        use: "indicator",
        which: "pop",
        scaleType: "log",
        allow: {
          scales: [
            "linear",
            "log"
          ]
        }
      },
      // should not be here because axis-y is not geo.name but order of population
      axis_y: {
        use: "property",
        which: "geo.name",
        scaleType: "log",
        allow: {
          scales: [
            "ordinal"
          ]
        }
      },
      color: {
        use: "property",
        which: "geo.region"
      }
    }
  },
  language: language,
  data: {
    //reader: "waffle",
    reader: "csv",
    path: globals.gapminder_paths.baseUrl + "data/waffles/basic-indicators.csv"
  },
  ui: {
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},
    presentation: false
  }
});

BubbleMap.define('datawarning_content', {
  title: "",
  body: "Comparing the size of economy across countries and time is not trivial. The methods vary and the prices change. Gapminder has adjusted the picture for many such differences, but still we recommend you take these numbers with a large grain of salt.<br/><br/> Countries on a lower income levels have lower data quality in general, as less resources are available for compiling statistics. Historic estimates of GDP before 1950 are generally also more rough. <br/><br/> Data for child mortality is more reliable than GDP per capita, as the unit of comparison, dead children, is universally comparable across time and place. This is one of the reasons this indicator has become so useful to measure social progress. But the historic estimates of child mortality are still suffering from large uncertainties.<br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
  doubtDomain: [1800, 1950, 2015],
  doubtRange: [1.0, .3, .2]
});

BubbleMap.define('default_options', {
  state: {
    time: {
      start: "1800",
      end: "2015",
      value: "2015",
      step: 1,
      speed: 300,
      formatInput: "%Y"
    },
    entities: {
      dim: "geo",
      opacitySelectDim: .3,
      opacityRegular: 1,
      show: {
        _defs_: {
          "geo.cat": ["country"]
        }
      },
    },
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "geo.name"
      },
      size: {
        use: "indicator",
        which: "pop",
        scaleType: "linear",
        allow: {
          scales: ["linear", "log"]
        },
        min: .04,
        max: .90
      },
      lat: {
        use: "property",
        which: "geo.lat"
      },
      lng: {
        use: "property",
        which: "geo.lng"
      },
      color: {
        use: "property",
        which: "geo.region",
        scaleType: "ordinal",
        allow: {
          names: ["!geo.name"]
        }
      }
    }
  },
  data: {
    reader: "waffle",
    path: "http://waffle-server-dev.gapminderdev.org/api/graphs/stats/vizabi-tools", 
    //reader: "csv",
    //path: globals.gapminder_paths.baseUrl + "data/waffles/dont-panic-poverty.csv",
    splash: true
  },
  language: language,
  ui: {
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},
    presentation: false
  }
});

MountainChart.define('datawarning_content', {
  title: "Income data has large uncertainty!",
  body: "There are many different ways to estimate and compare income. Different methods are used in different countries and years. Unfortunately no data source exists that would enable comparisons across all countries, not even for one single year. Gapminder has managed to adjust the picture for some differences in the data, but there are still large issues in comparing individual countries. The precise shape of a country should be taken with a large grain of salt.<br/><br/> Gapminder strongly agrees with <a href='https://twitter.com/brankomilan' target='_blank'>Branko Milanovic</a> about the urgent need for a comparable global income survey, especially for the purpose of monitoring the UN poverty-goal.<br/><br/> We are constantly improving our datasets and methods. Please expect revision of this graph within the coming months. <br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
  doubtDomain: [1800, 1950, 2015],
  doubtRange: [1.0, .8, .6]
});

MountainChart.define('default_options', {
  state: {
    time: {
      start: 1800,
      end: 2015,
      value: 2015,
      step: 1,
      delay: 100,
      delayThresholdX2: 50,
      delayThresholdX4: 25,
      formatInput: "%Y",
      xLogStops: [1, 2, 5],
      yMaxMethod: "latest",
      probeX: 1.85,
      tailFatX: 1.85,
      tailCutX: .2,
      tailFade: .7,
      xScaleFactor: 1.039781626,
      //0.9971005335,
      xScaleShift: -1.127066411,
      //-1.056221322,
      xPoints: 50
    },
    entities: {
      dim: "geo",
      opacitySelectDim: .3,
      opacityRegular: .6,
      show: {
        _defs_: {
          "geo": ["*"],
          "geo.cat": ["country"]
        }
      }
    },
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "geo.name"
      },
      axis_y: {
        use: "indicator",
        which: "pop",
        scaleType: 'linear'
      },
      axis_x: {
        use: "indicator",
        which: "gdp_pc",
        scaleType: 'log',
        min: .11, //0
        max: 500 //100
      },
      size: {
        use: "indicator",
        which: "gini",
        scaleType: 'linear'
      },
      color: {
        use: "property",
        which: "geo.region",
        scaleType: "ordinal",
        allow: {
          names: ["!geo.name"]
        }
      },
      stack: {
        use: "constant",
        which: "all" // set a property of data or values "all" or "none"
      },
      group: {
        use: "property",
        which: "geo.region", // set a property of data
        manualSorting: ["asi", "afr", "ame", "eur"],
        merge: false
      }
    }
  },
  language: language,
  data: {
    reader: "waffle",
    path: "http://waffle-server-dev.gapminderdev.org/api/graphs/stats/vizabi-tools", 
    //reader: "csv",
    //path: globals.gapminder_paths.baseUrl + "data/waffles/dont-panic-poverty.csv",
    splash: true
  },
  ui: {
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},      
    presentation: false
  }
});


LineChart.define('default_options', {
  state: {
    time: {
      start: 1800,
      end: 2012,
      value: 2012,
      step: 1,
      formatInput: "%Y"
    },
    //entities we want to show
    entities: {
      dim: "geo",
      show: {
        _defs_: {
          "geo": ["usa", "swe", "chn"],
          "geo.cat": ["country"]
        }
      }
    },
    //how we show it
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "geo.name"
      },
      axis_y: {
        use: "indicator",
        which: "gdp_pc",
        scaleType: "log"
      },
      axis_x: {
        use: "indicator",
        which: "time",
        scaleType: "time"
      },
      color: {
        use: "property",
        which: "geo.region",
        allow: {
          scales: ["ordinal"],
          names: ["!geo.name"]
        }
      }
    }
  },

  data: {
    reader: "csv",
    path: globals.gapminder_paths.baseUrl + "data/waffles/dont-panic-poverty.csv",
    splash: false
  },
  language: language,
  ui: {
    'vzb-tool-line-chart': {
      entity_labels: {
        min_number_of_entities_when_values_hide: 2 //values hide when showing 2 entities or more
      },
      whenHovering: {
        hideVerticalNow: 0,
        showProjectionLineX: true,
        showProjectionLineY: true,
        higlightValueX: true,
        higlightValueY: true,
        showTooltip: 0
      }
    },
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},
    presentation: false
  }
});

BubbleChart.define('datawarning_content', {
  title: "",
  body: "Comparing the size of economy across countries and time is not trivial. The methods vary and the prices change. Gapminder has adjusted the picture for many such differences, but still we recommend you take these numbers with a large grain of salt.<br/><br/> Countries on a lower income levels have lower data quality in general, as less resources are available for compiling statistics. Historic estimates of GDP before 1950 are generally also more rough. <br/><br/> Data for child mortality is more reliable than GDP per capita, as the unit of comparison, dead children, is universally comparable across time and place. This is one of the reasons this indicator has become so useful to measure social progress. But the historic estimates of child mortality are still suffering from large uncertainties.<br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
  doubtDomain: [1800, 1950, 2015],
  doubtRange: [1.0, .3, .2]
});

BubbleChart.define('default_options', {

  state: {
    time: {
      start: "1800",
      end: "2015",
      value: "2015",
      step: 1,
      formatInput: "%Y",
      trails: true,
      lockNonSelected: 0,
      adaptMinMaxZoom: false
    },
    entities: {
      dim: "geo",
      show: {
        _defs_: {
          "geo.cat": ["country"]
        }
      }
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
        which: "u5mr",
        scaleType: "linear",
        allow: {
          scales: ["linear", "log"]
        }
      },
      axis_x: {
        use: "indicator",
        which: "gdp_pc",
        scaleType: "log",
        allow: {
          scales: ["linear", "log"]
        }
      },
      color: {
        use: "property",
        which: "geo.region",
        scaleType: "ordinal",
        allow: {
          names: ["!geo.name"]
        },
        palette: {
          "asi": "#FF5872",
          "eur": "#FFE700",
          "ame": "#7FEB00",
          "afr": "#00D5E9",
          "_default": "#ffb600"
        }
      },
      size: {
        use: "indicator",
        which: "pop",
        scaleType: "linear",
        allow: {
          scales: ["linear", "log"]
        },
        min: .04,
        max: .90
      }
    }
  },
  data: {
    reader: "waffle",
    path: "http://waffle-server-dev.gapminderdev.org/api/graphs/stats/vizabi-tools", 
    //reader: "csv",
    //path: globals.gapminder_paths.baseUrl + "data/waffles/dont-panic-poverty.csv",
    splash: true
  },
  language: language,
  ui: {
    'vzb-tool-bubble-chart': {
      whenHovering: {
        showProjectionLineX: true,
        showProjectionLineY: true,
        higlightValueX: true,
        higlightValueY: true
      },
      labels: {
        autoResolveCollisions: true,
        dragging: true
      }
    },
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},
    presentation: false
  }
});

PopByAge.define('default_options', {
  state: {
    time: {
      value: '2013'
    },
    entities: {
      dim: "geo",
      show: {
        _defs_: {
          "geo": ["usa"]
        }
      }
    },
    entities_age: {
      dim: "age",
      show: {
        _defs_: {
          "age": [
              [0, 150]
            ] //show 0 through 100
        }
      },
      grouping: 5
    },
    marker: {
      space: ["entities", "entities_age", "time"],
      label: {
        use: "indicator",
        which: "age"
      },
      label_name: {
        use: "property",
        which: "geo"
      },
      axis_y: {
        use: "indicator",
        which: "age"
      },
      axis_x: {
        use: "indicator",
        which: "pop"
      },
      color: {
        use: "constant",
        which: "#ffb600",
        allow: {
          names: ["!geo.name"]
        }
      }
    }
  },
  data: {
    reader: "csv",
    path: globals.gapminder_paths.baseUrl + "data/waffles/{{geo}}.csv",
    splash: false
  },
  language: language,
  ui: {
    buttons: [],
    dialogs: {popup: [], sidebar: [], moreoptions: []},
    presentation: false
  }
});

//Waffle Server Reader custom path
WaffleReader.define('basepath', "http://52.18.235.31:8001/values/waffle");

//preloading mountain chart precomputed shapes
MCComponent.define("preload", function(done) {
  var shape_path = globals.gapminder_paths.baseUrl + "data/mc_precomputed_shapes.json";

  d3.json(shape_path, function(error, json) {
    if(error) return console.warn("Failed loading json " + shape_path + ". " + error);
    MCComponent.define('precomputedShapes', json);
    done.resolve();
  });
});

//preloading bubble map country shapes
BMComponent.define("preload", function(done) {
  var shape_path = globals.gapminder_paths.baseUrl + "data/world-50m.json";

  d3.json(shape_path, function(error, json) {
    if(error) return console.warn("Failed loading json " + shape_path + ". " + error);
    BMComponent.define('world', json);
    done.resolve();
  });
});


//preloading metadata for all charts
Tool.define("preload", function(promise) {

  var _this = this;

  var metadata_path = Vzb._globals.gapminder_paths.baseUrl + "data/waffles/metadata.json";
  var globals = Vzb._globals;


  //TODO: concurrent
  //load language first
  this.preloadLanguage().then(function() {
    //then metadata
    d3.json(metadata_path, function(metadata) {

      globals.metadata = metadata;

      //TODO: this is a hack that helps to hide indicators which are not present in data
      globals.metadata.indicatorsArray = utils.keys(metadata.indicatorsDB)
        .filter(function(f) {
          var one = metadata.indicatorsDB[f];
          return one.allowCharts.indexOf(_this.name) != -1 || one.allowCharts.indexOf("*") != -1;
        });

      // TODO: REMOVE THIS HACK
      // We are currently saving metadata info to default state manually in order
      // to produce small URLs considering some of the info in metadata to be default
      // we need a consistent way to add metadata to Vizabi
      addMinMax("axis_x");
      addMinMax("axis_y");
      addPalettes("color");
      
      promise.resolve();

    });
  });

  // TODO: REMOVE THIS HACK (read above)
  function addPalettes(hook) {
    if(!_this.default_options.state || !_this.default_options.state.marker[hook] || !globals.metadata.color) {
      return;
    }
    var color = _this.default_options.state.marker[hook];
    var palette = globals.metadata.color.palettes['geo.region'];
    color.palette = utils.extend({}, color.palette, palette);
  }

  function addMinMax(hook) {
    if(!_this.default_options.state || !_this.default_options.state.marker[hook]) {
      return;
    }
    var axis = _this.default_options.state.marker[hook];
    if(axis.use === "indicator" && globals.metadata.indicatorsDB[axis.which] && globals.metadata.indicatorsDB[axis.which].domain) {
      var domain = globals.metadata.indicatorsDB[axis.which].domain;
      axis.min = axis.min || domain[0];
      axis.max = axis.max || domain[1];
      axis.fakeMin = axis.fakeMin || axis.min || domain[0];
      axis.fakeMax = axis.fakeMax || axis.max || domain[1];
    }
  }

});

Tool.define("preloadLanguage", function() {
  var _this = this;
  var promise = new Promise();

  var langModel = this.model.language;
  var translation_path = Vzb._globals.gapminder_paths.baseUrl + "data/translation/" + langModel.id + ".json";

  if(langModel && !langModel.strings[langModel.id]) {
    d3.json(translation_path, function(langdata) {
      langModel.strings[langModel.id] = langdata;
      _this.model.language.strings.trigger("change");
      promise.resolve();
    });
  } else {
    this.model.language.strings.trigger("change");
    promise = promise.resolve();
  }

  return promise;

});

export default Vzb;
