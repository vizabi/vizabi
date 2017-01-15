var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1994",
      "endOrigin": "2011",
      "value": "2004",
      "dim": "year",
      "delay": "1000"
    },
    "entities": {
      "dim": "municipality2011",
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
        "which": "population",
        "scaleType": "linear",
        "allow": {
          "scales": ["linear"]
        }
      },
      "hook_lat": {
        "use": "property",
        "which": "lat",
        "_important": true
      },
      "hook_lng": {
        "use": "property",
        "which": "lng",
        "_important": true
      },
      "color": {
        "use": "indicator",
        "which": "u5mr",
        "scaleType": "linear",
        "palette": {
          "0": "#AAFFAA",
          "50": "#E1CE00",
          "100": "#FF0000",
          "_default": "#ffb600"
        },
        "syncModels": ["marker_colorlegend"]
      }
    },
    "marker_colorlegend":{
      "space": ["entities_colorlegend"],      
      "opacityRegular": 0,
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
      "scale": 0.8,
      "colorGeo": true,
      "topology": {
        "path": "data/zaf-municipalities-2011.json",
        "objects": {
          "geo": 'topo',
          "boundaries": 'topo'
        },
        "geoIdProperty": "MN_MDB_C"
      }
    },
    "splash": false
  },
  "data": {
    "reader": "ddf",
    "path": "data/ddf--statssa--u5mr"
  }
};