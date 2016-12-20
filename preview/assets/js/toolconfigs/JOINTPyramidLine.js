var VIZABI_MODEL = {
  "state": {
    "time": {
      "value": "2011",
      "start": "1996",
      "end": "2011",
      "dim": "time"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "geo": ["*"]
      }
    },
    "entities_age": {
      "dim": "age",
      "show": {
        "age": [
          [0, 95]
        ]
      },
      "grouping": 5,
      "_multiple": true
    },
    "entities_stack": {
      "space": ["entities_age", "entities_side"],
      "dim": "education",
      "_multiple": true,
      "select": []
    },
    "entities_side": {
      "dim": "sex"
    },
    "marker_pyramid": {
      "space": ["entities", "entities_side", "entities_stack", "entities_age", "time"],
      "label": {
        "use": "indicator",
        "which": "age"
      },
      "label_name": {
        "use": "property",
        "which": "sex"
      },
      "axis_y": {
        "use": "indicator",
        "which": "age",
        "domainMax": 100,
        "domainMin": 0
      },
      "axis_x": {
        "use": "indicator",
        "which": "zaf_population"
      },
      "color": {
        "use": "property",
        "which": "education"
      },
      "side": {
        "use": "property",
        "which": "sex"
      }
    },
    "marker_line": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "axis_y": {
        "use": "indicator",
        "which": "tfr",
        "scaleType": "linear",
        "allow": {
          "scales": ["linear", "log"]
        }
      },
      "axis_x": {
        "use": "indicator",
        "which": "time",
        "scaleType": "time",
        "allow": {
          "scales": ["time"]
        }
      },
      "color": {
        "use": "property",
        "which": "world_4region",
        "allow": {
          "scales": ["ordinal"],
          "names": ["!name"]
        }
      }
    },
    "marker_side": {
      "space": ["entities", "entities_side", "time"],
      "hook_total": {
        "use": "indicator",
        "which": "zaf_population"
      }
    }
  },
  "data": {
    "reader": "csv",
    "path": "data/zaf/waffles/ddf--datapoints--population--by--year--age--education-gender-add-tfr.csv",
    "splash": false
  }
};

var EXT_RESOURCES = {
  "host": LOCAL_URL,
  "preloadPath": "data/zaf/",
  "dataPath": "data/zaf/waffles/"
};
