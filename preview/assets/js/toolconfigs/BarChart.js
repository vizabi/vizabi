var VIZABI_MODEL = {
  "state": {
    "time": {
      "start": "1800",
      "end": "2012",
      "value": "2000"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "geo": {"$in": ["usa", "swe", "nor"]}
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
    "marker": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "axis_y": {
        "use": "indicator",
        "which": "population_total",
        "scaleType": "log"        
      },
      "axis_x": {
        "use": "property",
        "which": "name",
        "allow": {
          "names": ["name"]
        }
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
};