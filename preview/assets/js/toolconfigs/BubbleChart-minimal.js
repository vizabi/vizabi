var VIZABI_MODEL = {
  "state": {
    "time": {
      "dim": "time"
    },
    "entities": {
      "dim": "geo"
    },
    "marker": {
      "label": {
        "which": "name"
      },
      "axis_y": {
        "which": "life_expectancy_years"
      },
      "axis_x": {
        "which": "life_expectancy_years"
      }
    }
  },
  "data": {
    "reader": "waffle",
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/"
  }
};
