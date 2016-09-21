
var VIZABI_MODEL = {
  state: {
    time: {
      start: 1800,
      end: 2012,
      value: 2012,
      step: 1,
    },
    //entities we want to show
    entities: {
      dim: "geo",
      show: {
        "country": { "$in": ["usa", "swe", "chn"] }
      }
    },
    entities_minimap: {
      dim: "geo",
      show: {
        "is--world_4region": true
      }
    },
    //how we show it
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "name"
      },
      axis_y: {
        use: "indicator",
        which: "sg_gdp_p_cap_const_ppp2011_dollar",//systema globalis
        //which: "income_per_person_gdppercapita_ppp_inflation_adjusted",
        scaleType: "log",
        allow: {
          scales: ["linear", "log", "time"]
        }

      },
      axis_x: {
        use: "indicator",
        which: "time",
        scaleType: "time",
        allow: {
          scales: ["time"]
        }
      },
      color: {
        use: "property",
        which: "world_4region",
        allow: {
          scales: ["ordinal"],
          names: ["!name"]
        }
      }
    },
    entities_allpossible: {
      dim: "geo",
      show: {
        "is--country": true
      }
    },
    entities_tags: {
      dim: "tag"
    },
    marker_allpossible: {
      space: ["entities_allpossible"],
      label: {
        use: "property",
        which: "name"
      }
    },
    marker_minimap:{
      space: ["entities_minimap"],
        type: "geometry",
        shape: "svg",
        label: {
          use: "property",
          which: "name"
        },
        geoshape: {
          use: "property",
          which: "shape_lores_svg"
        }
    },
    marker_tags: {
      space: ["entities_tags"],
      label: {
        use: "property",
        which: "name"
      },
      parent: {
        use: "property",
        which: "parent"
      }
    }
  },
  language: {
    id: "en",
    strings: {}
  },
  ui: {
    chart: {
      labels: {
        min_number_of_entities_when_values_hide: 2 //values hide when showing 2 entities or more
      },
      whenHovering: {
        hideVerticalNow: false,
        showProjectionLineX: true,
        showProjectionLineY: true,
        higlightValueX: true,
        higlightValueY: true,
        showTooltip: false
      }
    },
    presentation: false
  }
}