var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1800",
      "endOrigin": "2012",
      "value": "2000",
      "dim": "time"
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
        "which": "  ",
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
        "scaleType": "ordinal",
        "colorlegend": "marker_colorlegend"
      }
    },
    "marker_colorlegend":{
      "space": ["entities_colorlegend"],
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
  },
  "ui": {
    "datawarning": {
      "doubtDomain": [1800, 1950, 2015],
      "doubtRange": [1.0, 0.8, 0.6]
    },
    "splash": false
  },
  "data": {
    "reader": "waffle",
    //"reader": "ddf",
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/"
    //"path": "data/systema_globalis"
  }
};