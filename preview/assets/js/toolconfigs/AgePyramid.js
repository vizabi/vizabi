var VIZABI_MODEL = { 
  state: {
    time: {
      value: '2011',
      start: '1950',
      end: '2100',
      step: 1,
      delayThresholdX2: 0,
      delayThresholdX4: 0,
      immediatePlay: true,
      delay: 1500
    },
    entities: {
      dim: "geo",
      show: {
          "geo": ["*"]
      }
    },
    entities_colorlegend: {
      dim: "geo",
      show: {
          "is--country": true
      }
    },
    entities_age: {
      dim: "age",
      show: {
          "age": [
            [0, 95]
          ] //show 0 through 100
      },
      grouping: 1,
      _multiple: true
    },
    entities_stack: {
      space: ["entities_age", "entities_side"],
      dim: "education_attainment",
      _multiple: true
    },
    entities_side: {
      dim: "population_group"
    },
    marker: {
      space: ["entities", "entities_side", "entities_stack", "entities_age", "time"],
      label: {
        use: "indicator",
        which: "age"
      },
      label_name: {
        use: "property",
        which: "population_group"
      },
      axis_y: {
        use: "indicator",
        which: "age",
        // domain Max should be set manually as age max from entites_age plus one grouping value (95 + 5 = 100)
        // that way the last age group fits in on the scale
        domainMax: 100,
        domainMin: 0
      },
      axis_x: {
        use: "indicator",
        which: "population",
        //domainMin: 0,
        //domainMax: 1400000000
      },
      color: {
        use: "property",
        which: "education_attainment",
        colorlegend: "marker_colorlegend"
      },
      side: {
        use: "property",
        which: "population_group"
      }
    },
    marker_side: {
      space: ["entities", "entities_side", "time"],
      hook_total: {
        use: "indicator",
        which: "population"
      }      
    },
    marker_colorlegend:{
      space: ["entities_stack"],
        type: "geometry",
        shape: "svg",
        label: {
          use: "property",
          which: "education_attainment"
        },
        hook_rank: {
          use: "property",
          which: "rank"
        },
        hook_geoshape: {
          use: "property",
          which: "shape_lores_svg"
        }
    }
  }
}