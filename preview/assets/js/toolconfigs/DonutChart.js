var VIZABI_MODEL = { 
  state: {
    // available time would have the range of 1990-2012 years (%Y), with the deafult position at 2000
    time: {
      start: "1990",
      end: "2012",
      value: "2000"
    },
    //Entities include all ("*") geo's of category "regions" -- equivalent to 'geo: ["asi", "ame", "eur", "afr"]'
    entities: {
      dim: "geo",
      show: {
          "geo": ["usa", "bra", "chn", "ind", "idn"]
      }
    },
    //Markers correspond to visuals that we want to show. We have label, axis and color
    marker: {
      space: ["entities", "time"],
      label: {
        use: "property",
        which: "name"
      },
      axis: {
        use: "indicator",
        which: "sg_population"
      },
      color: {
        use: "property",
        which: "world_4region"
      }
    }
  }

}