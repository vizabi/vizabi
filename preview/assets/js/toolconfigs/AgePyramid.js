var VIZABI_MODEL = {
  "state": {
    "time": {
      "value": "2001",
      "startOrigin": "1995",
      "endOrigin": "2001",
      "step": 1,
      "delayThresholdX2": 0,
      "delayThresholdX4": 0,
      "immediatePlay": true,
      "delay": 1500,
      "dim": "year"
    },
    "entities": {
      "dim": "country_code",
      "show": {
        "country_code": {
          "$in": [900]
        }
      }
    },
    "entities_colorlegend": {
      "dim": "country_code",
      "show": {
        "country_code": {
          "$in": [900]
        }
      }
    },
    "entities_age": {
      "dim": "age",
      "show": {
        "age": {
          "$lte": 95,
          "$gte": 0
        }
      },
      "grouping": 1
    },
    "entities_stack": {
      "dim": "country_code",
      "show": {
        "country_code": {
          "$in": [900]
        }
      }
    },
    "entities_side": {
      "dim": "gender"
    },
    "marker": {
      "space": ["entities_stack", "time", "entities_side", "entities_age"],
      "label": {
        "use": "property",
        "which": "age"
      },
      "label_name": {
        "use": "property",
        "spaceRef": "entities_side",
        "which": "name"
      },
      "axis_y": {
        "use": "property",
        "which": "age",
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
        "allow": {
          "scales": ["ordinal"]
        },
        "syncModels": ["marker_colorlegend"]
      },
      "hook_side": {
        "use": "property",
        "which": "gender"
      },
    },
    "marker_side": {
      "space": ["entities_stack", "time", "entities_side", "entities_age"],
      "hook_total": {
        "use": "indicator",
        "which": "population"
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
    "entities_tags": {
      "dim": "tag"
    },
    "marker_tags": {
      "space": ["entities_tags"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "hook_parent": {
        "use": "property",
        "which": "parent"
      }
    }
  },
  "ui": {
    "buttons":['colors', 'inpercent','moreoptions', 'fullscreen'],
    "dialogs": {
      'popup': ['colors', 'moreoptions'], 
      'sidebar': ['colors'], 
      'moreoptions': ['opacity', 'speed', 'colors','presentation', 'about']
    }
  },
//  "data": {
//    "reader": "csv",
//    "delimiter": ";",
//    "nowManyFirstColumnsAreKeys": 4,
//    "path": "data/zaf/waffles/ddf--datapoints--population--by--year--age--population_group--education_attainment.csv",
//    "splash": false
//  },
//  "data": {
//    "reader": "ddf",
//    "path": "data/ddf--unpop--wpp_population",
//    "splash": false
//  },
  "data": {
    "reader": "waffle",
    "dataset": "open-numbers/ddf--unpop--wpp_population",
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/",
    "splash": false
  }
};

var EXT_RESOURCES = {
  "host": LOCAL_URL,
  "preloadPath": "data/zaf/",
  "dataPath": "data/zaf/waffles/"
};