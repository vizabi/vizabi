var VIZABI_MODEL = {
  "state": {
    "time": {
      "dim": "Year",
      "startOrigin": "1950",
      "endOrigin": "2015"
    },
    "entities": {
      "dim": "Country",
      "show": {"Size": "big"}
    },
    "marker": {
      "label": {
        "which": "Country"
      },
      "axis_y": {
        "which": "Child mortality rate"
      },
      "axis_x": {
        "which": "GDP per capita"
      },
      "size": {
        "which": "Population",
        "use": "indicator"
      }
    }
  },
  "data": {
    "reader": "csv",
    "delimiter": ";",
    "splash": true,
    "path": "data/waffles/test-semicolon_delimiter.csv"
  }
};

