
var VIZABI_MODEL = {
  "state": {
    "time": {
      "start": "1800",
      "end": "2015",
      "value": "2015",
    },
    "entities": {
      "dim": "geo",
      "show": {
        country: { "$in": ["usa", "swe", "chn"] }
      }
    },
    "entities_minimap": {
      "dim": "geo",
      "show": {
        "is--world_4region": true
      }
    },
    "marker": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "axis_y": {
        "use": "indicator",
        "which": "income_per_person_gdppercapita_ppp_inflation_adjusted",
        "scaleType": "log",
        "domainMin": 300,
        "domainMax": 128000,
        "allow": {
          "scales": ["linear", "log", "time"]
        }

      },
      "axis_x": {
        "use": "indicator",
        "which": "time",
        "scaleType": "time",
        "allow": {
          "scales": ["time"]
        }
      },
      "color": {
        "use": "property",
        "which": "world_4region",
        "allow": {
          "scales": ["ordinal"],
          "names": ["!name"]
        }
      }
    },
    "entities_allpossible": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "entities_tags": {
      "dim": "tag"
    },
    "marker_allpossible": {
      "space": ["entities_allpossible"],
      "label": {
        "use": "property",
        "which": "name"
      }
    },
    "marker_minimap":{
      "space": ["entities_minimap"],
        "type": "geometry",
        "shape": "svg",
        "label": {
          "use": "property",
          "which": "name"
        },
        "geoshape": {
          "use": "property",
          "which": "shape_lores_svg"
        }
    },
    "marker_tags": {
      "space": ["entities_tags"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "parent": {
        "use": "property",
        "which": "parent"
      }
    }
  }
}