var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1993",
      "endOrigin": "2012",
      "dim": "time"
    },
    "entities": {
      "dim": "country",
    },
    "marker": {
      "label": {
        "which": "country"
      },
      "axis_y": {
        "which": "CO2 emissions (metric tons per capita)"
      },
      "axis_x": {
        "which": "time",
        "scaleType": "time"
      },
      "size": {
        "which": "CO2 emissions (metric tons per capita)",
        "use": "indicator"
      }
    }
  },
  "data": {
    "reader": "csv-time_in_columns",
    "splash": true,
    "path": "data/waffles/test-time_in_columns.csv"
  }
};