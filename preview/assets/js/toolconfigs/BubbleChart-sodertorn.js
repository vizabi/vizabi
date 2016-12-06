var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1993",
      "endOrigin": "2012",
      "dim": "year"
    },
    "entities": {
      "dim": "basomrade",
      "show": { "municipality": "0120_varmdo"}
    },
    "marker": {
      "label": {
        "which": "name"
      },
      "axis_y": {
        "which": "immigration_surplus"
      },
      "axis_x": {
        "which": "mean_income_aged_lt_20_male"
      },
      "size": {
        "which": "population_20xx_12_31",
        "use": "indicator"
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

