var VIZABI_MODEL = { 
  state: {
    time: {
      value: '2013',
      start: '1950',
      end: '2100'
    },
    entities: {
      dim: "geo",
      show: {
          "geo": ["usa"]
      }
    },
    entities_colorlegend: {
      dim: "geo"
    },
    entities_age: {
      dim: "age",
      show: {
          "age": [
            [0, 95]
          ] //show 0 through 100
      },
      grouping: 5
    },
    marker: {
      space: ["entities", "entities_age", "time"],
      label: {
        use: "indicator",
        which: "age"
      },
      label_name: {
        use: "property",
        which: "geo"
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
        which: "sg_population"
      },
      color: {
        use: "constant",
        which: "#ffb600",
        colorlegend: "marker_colorlegend"
      }
    },
    marker_colorlegend:{
      space: ["entities_colorlegend"],
        type: "geometry",
        shape: "svg",
        label: {
          use: "property",
          which: "name"
        },
        hook_rank: {
          use: "property",
          which: "rank"
        },
        "hook_geoshape: {
          use: "property",
          which: "shape_lores_svg"
        }
    }
  }
}