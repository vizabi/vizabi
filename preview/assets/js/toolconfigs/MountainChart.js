var VIZABI_MODEL = {
  state: {
    time: {
      delay: 100,
      delayThresholdX2: 50,
      delayThresholdX4: 25
    },
    entities: {
      dim: "geo",
      opacitySelectDim: .3,
      opacityRegular: .7,
      show: {
        "is--country": true
      }
    },
    entities_allpossible: {
      dim: "geo",
      show: {
        "is--country": true
      }
    },
    entities_minimap: {
      dim: "geo",
      show: {
        "is--world_4region": true
      }
    },
    entities_group: {
      dim: "geo",
      show: {
          "is--world_4region": true
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
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "name"
      },
      axis_y: {
        use: "indicator",
        which: "sg_population",//systema globalis
        //which: "population_total",
        scaleType: 'linear'
      },
      axis_x: {
        use: "indicator",
        which: "sg_gdp_p_cap_const_ppp2011_dollar",//systema globalis
        //which: "income_per_person_gdppercapita_ppp_inflation_adjusted",
        scaleType: 'log',
        domainMin: .11, //0
        domainMax: 500, //100
        tailFatX: 1.85,
        tailCutX: .2,
        tailFade: .7,
        xScaleFactor: 1.039781626,
        xScaleShift: -1.127066411
      },
      axis_s: {
        use: "indicator",
        which: "sg_gini", //systema globalis
        //which: "inequality_index_gini",
        scaleType: 'linear'
      },
      color: {
        use: "property",
        which: "world_4region",
        scaleType: "ordinal",
        allow: {
          names: ["!name"]
        }
      },
      stack: {
        use: "constant",
        which: "all" // set a property of data or values "all" or "none"
      },
      group: {
        use: "property",
        which: "world_4region", // set a property of data
        manualSorting: ["asia", "africa", "americas", "europe"],
        merge: false
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
    marker_group:{
      space: ["entities_group"],
        label: {
          use: "property",
          which: "name"
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
  }
}