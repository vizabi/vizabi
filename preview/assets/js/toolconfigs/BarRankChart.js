var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1950",
      "endOrigin": "2015",
      "value": "2015"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "entities_colorlegend": {
      "dim": "geo"
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
