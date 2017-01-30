var VIZABI_MODEL = {
  "state": {
    "time": {
      "dim": "time"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "geo": {
          "$in": ["usa", "bra", "chn", "ind", "idn"]
        }
      }
    },
    "marker": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "axis": {
        "use": "indicator",
        "which": "population_total"
      },
      "color": {
        "use": "property",
        "which": "world_4region"
      }
    }
  },
  "ui": {
    "datawarning": {
      "doubtDomain": [1800, 1950, 2015],
      "doubtRange": [1.0, 0.3, 0.2]
    },
    "splash": true
  },
  "data": {
    "reader": "waffle",
    //"reader": "ddf",
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/"
    //"path": "data/systema_globalis"
  }
};
