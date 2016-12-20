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
        "geo": { "$in": ["usa", "rus", "chn", "nga"] }
      }
    },
    "entities_colorlegend": { 
      "dim": "world_4region"
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
        "scaleType": "log"
      },
      "axis_x": {
        "use": "indicator",
        "which": "time",
        "scaleType": "time"
      },
      "color": {
        "use": "property",
        "which": "world_4region",
        "allow": {
          "scales": ["ordinal"]
        },
        "syncModels": ["marker_colorlegend"]
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
    "marker_colorlegend": {
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
    "buttons": ['colors', 'find', 'show', 'moreoptions', 'fullscreen', 'presentation'],
    "dialogs": {
      'popup': ['colors', 'find', 'show', 'moreoptions'], 
      'sidebar': ['colors', 'show'], 
      'moreoptions': ['opacity', 'speed', 'axes', 'colors', 'presentation', 'about']
    }
  },
  "data": {
    "reader": "waffle",
    //"reader": "ddf",
    "splash": false,
    "path": "https://waffle-server-dev.gapminderdev.org/api/ddf/"
    //"path": "data/systema_globalis"
  }
};
