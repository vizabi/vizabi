var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1993",
      "endOrigin": "2012"
    },
    "entities": {
      "dim": "geo",
      "show": {"category": "country"}
    },
    "marker": {
      "label": {
        "which": "geo"
      },
      "axis_y": {
        "which": "LEX"
      },
      "axis_x": {
        "which": "GDP"
      },
      "size": {
        "which": "POP",
        "use": "indicator"
      }
    }
  },
  "data": {
    "reader": "csv",
    "splash": true,
    "path": "data/waffles/basic-indicators.csv"
  }
};

