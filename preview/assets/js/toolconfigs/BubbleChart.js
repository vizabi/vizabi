var VIZABI_MODEL = { 
  state: {
    time: {
      start: 1800,
      end: 2015,
      value: 1995
    },
    entities: {
      dim: "geo"
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
        which: "life_expectancy_years" 
      },
      axis_x: {
        use: "indicator",
        which: "income_per_person_gdppercapita_ppp_inflation_adjusted"
      },
      size: {
        use: "indicator",
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