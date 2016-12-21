var VIZABI_MODEL = {
  "state": {
    "time": {
      "value": "2011",
      "start": "1950",
      "end": "2100",
      "step": 1,
      "delayThresholdX2": 0,
      "delayThresholdX4": 0,
      "immediatePlay": true,
      "delay": 1500,
      "dim": "time"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "geo": {
          "$in": ["zaf"]
        }
      }
    },
    "entities_colorlegend": {
      "dim": "geo",
      "show": {
        "geo": {
          "$in": ["zaf"]
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
      "dim": "education_attainment"
    },
    "entities_side": {
      "dim": "population_group"
    },
    "marker": {
      "space": ["entities", "entities_side", "entities_stack", "entities_age", "time"],
      "label": {
        "use": "indicator",
        "which": "age"
      },
      "label_name": {
        "use": "property",
        "which": "population_group"
      },
      "axis_y": {
        "use": "indicator",
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
        "which": "education_attainment",
        "allow": {
          "scales": ["ordinal"]
        },
        "syncModels": ["marker_colorlegend"]
      },
      "hook_side": {
        "use": "property",
        "which": "population_group"
      },
    },
    "marker_side": {
      "space": ["entities", "entities_side", "time"],
      "hook_total": {
        "use": "indicator",
        "which": "population"
      }
    },
    "marker_colorlegend": {
      "space": ["entities_colorlegend"],
      "label": {
        "use": "property",
        "which": "education_attainment"
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
  "data": {
    "reader": "csv",
    "delimiter": ";",
    "nowManyFirstColumnsAreKeys": 4,
    "path": "data/zaf/waffles/ddf--datapoints--population--by--year--age--population_group--education_attainment.csv",
    "splash": false
  }
};

var EXT_RESOURCES = {
  "host": LOCAL_URL,
  "preloadPath": "data/zaf/",
  "dataPath": "data/zaf/waffles/"
};