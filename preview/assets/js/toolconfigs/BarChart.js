var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1800",
      "endOrigin": "2012",
      "value": "2000"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "geo": {"$in": ["usa", "swe", "nor"]}
      }
    },
    "entities_colorlegend": {
      "dim": "geo"
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
        "which": "world_4region",
        "colorlegend": "marker_colorlegend"
      }
    },
    "marker_colorlegend":{
      "space": ["entities_colorlegend"],
        "type": "geometry",
        "shape": "svg",
        "label": {
          "use": "property",
          "which": "name"
        },
        "hook_rank": {
          "use": "property",
          "which": "rank"
        },
        "hook_geoshape": {
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
      "hook_parent": {
        "use": "property",
        "which": "parent"
      }
    }
  }
};