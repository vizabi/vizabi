var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1990",
      "endOrigin": "2012",
      "value": "2000"
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
        "which": "sg_population"
      },
      "color": {
        "use": "property",
        "which": "world_4region"
      }
    }
  }
};
