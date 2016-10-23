var VIZABI_MODEL = {
  "state": {
    "time": {
      "start": "1800",
      "end": "2015",
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
    "marker": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "size": {
        "use": "indicator",
        "which": "population_total",
        "scaleType": "linear",
        "allow": {
          "scales": ["linear"]
        }
      },
      "lat": {
        "use": "property",
        "which": "latitude",
        "_important": true
      },
      "lng": {
        "use": "property",
        "which": "longitude",
        "_important": true
      },
      "color": {
        "use": "property",
        "which": "world_4region",
        "scaleType": "ordinal",
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