var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1800",
      "endOrigin": "2015",
      "value": "2015"
    },
    "entities": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "entities_allpossible": {
      "dim": "geo",
      "show": {
        "is--country": true
      }
    },
    "entities_colorlegend": {
      "dim": "geo",
      "show": {
        "is--world_4region": true
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
    "marker": {
      "space": ["entities", "time"],
      "label": {
        "use": "property",
        "which": "name"
      },
      "axis_y": {
        "use": "indicator",
        "which": "sg_population",
        "scaleType": "linear"
      },
      "axis_x": {
        "use": "indicator",
        "which": "sg_gdp_p_cap_const_ppp2011_dollar",
        "scaleType": "log",
        "domainMin": 0.11,
        "domainMax": 500,
        "tailFatX": 1.85,
        "tailCutX": 0.2,
        "tailFade": 0.7,
        "xScaleFactor": 1.039781626,
        "xScaleShift": -1.127066411
      },
      "axis_s": {
        "use": "indicator",
        "which": "sg_gini",
        "scaleType": "linear"
      },
      "color": {
        "use": "property",
        "which": "world_4region",
        "scaleType": "ordinal",
        "syncModels": ["marker_colorlegend", "stack", "group"]
      },
      "stack": {
        "use": "constant",
        "which": "all"
      },
      "group": {
        "use": "property",
        "which": "world_4region",
        "merge": false
      }
    },
    "marker_colorlegend": {
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
  },
  "ui": {
    "datawarning": {
      "doubtDomain": [1800, 1950, 2015],
      "doubtRange": [1.0, 0.8, 0.6]
    }
  }
};
