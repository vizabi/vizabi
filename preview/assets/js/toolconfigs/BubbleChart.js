var VIZABI_MODEL = { 
  state: {
    entities: {
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
    entities_tags: {
      dim: "tag"
    },
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "name"
      },
      axis_y: {
        use: "indicator",
        domainMin: 19,
        domainMax: 85,
        which: "life_expectancy_years" //which: "sg_child_mortality_rate_per1000", //systema globalis
      },
      axis_x: {
        use: "indicator",
        which: "income_per_person_gdppercapita_ppp_inflation_adjusted",  //which: "sg_gdp_p_cap_const_ppp2011_dollar",//systema globalis
        scaleType: "log",
        domainMin: 300,
        domainMax: 150000
      },
      color: {
        use: "property",
        which: "world_4region",
        scaleType: "ordinal",
        allow: {
          names: ["!name"]
        }
      },
      size: {
        use: "indicator",
        //which: "sg_population",//systema globalis
        which: "population_total"
      }
    },
    marker_minimap:{
      space: ["entities_minimap"],
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
  }
}