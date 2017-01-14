var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1800",
      "endOrigin": "2015",
      "value": "2015",
      "dim": "time"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "entities_colorlegend": { 
      "dim": "world_4region"
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
        "domainMin": 15,
        "domainMax": 1400000000,
        "allow": {
          "scales": ["linear"]
        }
      },
      "hook_lat": {
        "use": "property",
        "which": "latitude",
        "_important": true
      },
      "hook_lng": {
        "use": "property",
        "which": "longitude",
        "_important": true
      },
      "color": {
        "use": "property",
        "which": "world_4region",
        "scaleType": "ordinal",
        "syncModels": ["marker_colorlegend"]
      }
    },
    "marker_colorlegend":{
      "space": ["entities_colorlegend"],      
      "opacityRegular": 0.8,
      "opacityHighlightDim": 0.3,     
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
      "doubtRange": [1.0, 0.3, 0.2]
    },
    "buttons": ['colors', 'find', 'size', 'moreoptions', 'fullscreen', 'presentation'],
    "dialogs": {
      'popup': ['colors', 'find', 'size', 'moreoptions'], 
      'sidebar': ['colors', 'find', 'size'], 
      'moreoptions': ['opacity', 'speed', 'size', 'colors', 'presentation', 'about']
    },
    "map": {
      "scale": 1,
      "preserveAspectRatio": false,
      "offset": {
        "top": 0.05,
        "bottom": -0.12
      }
    },
    "splash": true
  },
  "data": {
    "reader": "waffle",
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/"
  }
};