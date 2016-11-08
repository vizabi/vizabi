var VIZABI_MODEL = {
  "state": {
    "time": {
      "start": "1800",
      "end": "2015",
      "value": "2015",
      "step": 1,
      "speed": 300,
      "dim": "year"
    },
    "entities": {
      "dim": "municipality",
      "opacitySelectDim": .3,
      "opacityRegular": 1,
      "show": {
        "is--municipality": true
      },
    },
    "entities_colorlegend": {
      "dim": "province",
      "show": {
        "is--province": true
      }
    },
    "marker": {
      "space": ["entities", "time"],
      "size": {
        "use": "constant",
        "which": "_default",
        "scaleType": "ordinal",
        "_important": true,
        "showArcs": false,
        "allow": {
          "scales": ["linear", "ordinal"]
        },
        "extent": [0, 1]
      },
      "color": {
        "use": "indicator",
        "which": "piped_water_percentage",
        "scaleType": "linear",
        "colorlegend": "marker_colorlegend",
        "_important": true
      },
      "label": {
        "use": "property",
        "which": "municipality.name"
      }
    },
    "marker_colorlegend": {
      "space": ["entities_colorlegend"],
      "type": "geometry",
      "shape": "svg",
      "label": {
        "use": "property",
        "which": "municipality.name"
      },
      "hook_rank": {
        "use": "property",
        "which": "rank"
      },
      "hook_geoshape": {
        "use": "property",
        "whichh": "shape_lores_svg"
      }
    }
  },
  "ui": {
    "datawarning": {
      "doubtDomain": [1800, 1950, 2015],
      "doubtRange": [1.0, 0.3, 0.2]
    }
  }
};
