var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1993",
      "endOrigin": "2012",
      "dim": "year",
      "delay": 1
    },
    "entities": {
      "dim": "basomrade",
      "show": { }
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
        "which": "population_20xx_12_31"
      },
      "color": {
        "use": "property",
        "which": "municipality"
      }
    }
  },
  "data": {
    "reader": "ddf",
    "splash": false,
    "path": "data/sodertorn",
    "dataset": "Gapminder/ddf--sodertorn"
  }
};

