var VIZABI_MODEL = {
  "state": {
    "time": {
      //"value": "2000",
      //"startOrigin": "1970",
      //"endOrigin": "2000",
      "step": 1,
      "delayThresholdX2": 0,
      "delayThresholdX4": 0,
      "immediatePlay": true,
      "delay": 1000,
      "dim": "year"
    },
    "entities": {
      "dim": "country_code",
      "show": {
        "country_code": {
          "$in": ["903","904","905","908","909","935"]
        }
      }
    },
    "entities_colorlegend": {
      "dim": "country_code"
    },
    "entities_age": {
      "dim": "age",
      "show": {
        "age": {
          "$nin": ["80plus","100plus"]
        }
      },
      "grouping": 1
    },
    "entities_side": {
      "dim": "gender"
    },
    "marker": {
      "space": ["entities", "time", "entities_side", "entities_age"],
      "label_stack": {
        "use": "property",
        "spaceRef": "entities",
        "which": "name"
      },
      "label_side": {
        "use": "property",
        "spaceRef": "entities_side",
        "which": "name"
      },
      "axis_y": {
        "use": "property",
        "which": "age",
        "spaceRef": "entities_age",
        "domainMax": 100,
        "domainMin": 0,
        "_important": false
      },
      "axis_x": {
        "use": "indicator",
        "which": "population",
      },
      "color": {
        "use": "property",
        "which": "country_code",
        "spaceRef": "entities",
        "allow": {
          "scales": ["ordinal"]
        },
        "syncModels": ["marker_colorlegend"]
      },
      "side": {
        "use": "property",
        "which": "gender",
        "spaceRef": "entities_side",
        "allow": {
          "scales": ["ordinal"]
        }
      }
    },
    "entities_allpossible": {
      "dim": "country_code",
    },
    "marker_allpossible": {
      "space": ["entities_allpossible"],
      "label": {
        "use": "property",
        "which": "name"
      }
    },
    "entities_allpossibleside": {
      "dim": "gender",
    },
    "marker_allpossibleside": {
      "space": ["entities_allpossibleside"],
      "label": {
        "use": "property",
        "which": "name"
      }
    },
    "marker_colorlegend": {
      "space": ["entities_colorlegend"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "hook_rank": {
        "use": "property",
        "which": "rank"
      },
      "hook_geoshape": {
        "use": "property",
        "which": "shape_lores_svg"
      }
    },
    "entities_tags": { },
    "marker_tags": {
      "space": ["entities_tags"],
      "label": {},
      "hook_parent": {}
    }
  },
  "ui": {
    "buttons":['colors', 'inpercent', 'side', 'moreoptions', 'fullscreen'],
    "dialogs": {
      'popup': ['timedisplay', 'colors', 'side', 'moreoptions'], 
      'sidebar': ['timedisplay', 'colors', 'show'], 
    'moreoptions': ['opacity', 'speed', 'colors', 'side', 'presentation', 'about']
    },
    "splash": true
  },
//  "data": {
//    "reader": "csv",
//    "delimiter": ";",
//    "nowManyFirstColumnsAreKeys": 4,
//    "path": "data/zaf/waffles/ddf--datapoints--population--by--year--age--population_group--education_attainment.csv"
//  },
//  "data": {
//    "reader": "ddf",
//    "path": "data/ddf--unpop--wpp_population"
//  },
  "data": {
    "reader": "waffle",
    "dataset": "angieskazka/ddf--unpop--wpp_population",
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/"
  }
};

var EXT_RESOURCES = {
  "host": LOCAL_URL,
  "preloadPath": "data/zaf/",
  "dataPath": "data/zaf/waffles/"
};