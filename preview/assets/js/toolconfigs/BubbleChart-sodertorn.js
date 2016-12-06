var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1993",
      "endOrigin": "2015",
      "dim": "year",
      "delay": 1
    },
    "entities": {
      "opacitySelectDim": "0.05",
      "dim": "basomrade",
      "show": { }
    },
    "entities_colorlegend": {
      "dim": "municipality"
    },
    "marker": {
      "label": {
        "which": "name"
      },
      "axis_y": {
        "which": "cumulative_immigration_surplus"
      },
      "axis_x": {
        "which": "mean_income_aged_lt_20"
      },
      "size": {
        "use": "indicator",
        "which": "population_20xx_12_31",
        "extent": [0, 0.4]
      },
      "color": {
        "use": "property",
        "which": "municipality",
        "syncModels": ["marker_colorlegend"]
      }
    },
    "marker_colorlegend":{
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
    }
  },
  "data": {
    "reader": "ddf",
    "splash": false,
    "path": "data/sodertorn",
    "dataset": "Gapminder/ddf--sodertorn"
  },
  "ui": {
    "chart": {
      "labels": {"removeLabelBox": true},
      "trails": false
    }
  }
};

