var VIZABI_MODEL = { 
  "state": {
    "entities": {
      "dim": "geo"
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
      "axis_y": {
        "use": "indicator",
        "which": "life_expectancy_at_birth_years" 
      },
      "axis_x": {
        "use": "indicator",
        "which": "life_expectancy_at_birth_years"
      }
    },
    "marker_minimap":{
      "space": ["entities_minimap"],
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