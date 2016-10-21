var VIZABI_MODEL = { 
  "state": {
    "time": {
      "start": "1950",
      "end": "2015",
      "value": "2015"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "entities_minimap": {
      "dim": "geo",
      "show": {
        "is--world_4region": true
      }
    },
    "entities_tags": {
      "dim": "tag"
    },
    "entities_allpossible": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "marker_allpossible": {
      "space": ["entities_allpossible"],
      "label": {
        "use": "property",
        "which": "name"
      }
    },
    "marker": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "axis_x": {
        "use": "indicator",
        "which": "population_total"
      },
      "axis_y": {
        "use": "property",
        "which": "name"
      },
      "color": {
        "use": "property",
        "which": "world_4region"
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