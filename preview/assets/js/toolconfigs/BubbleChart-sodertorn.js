var VIZABI_MODEL = {
  "state": {
    "time": {
      "startOrigin": "1993",
      "endOrigin": "2015",
      "dim": "year",
      "delay": 700
    },
    "entities": {
      "opacitySelectDim": "0.05",
      "dim": "basomrade",
      "show": { }
    },
    "entities_colorlegend": {
      "dim": "municipality"
    },
    "marker": {
      "label": {
        "which": "name"
      },
      "axis_y": {
        "which": "cumulative_immigration_surplus"
      },
      "axis_x": {
        "which": "mean_income_aged_lt_20"
      },
      "size": {
        "use": "indicator",
        "which": "population_20xx_12_31",
        "extent": [0, 0.4]
      },
      "color": {
        "use": "property",
        "which": "municipality",
        "syncModels": ["marker_colorlegend"]
      }
    },
    "marker_colorlegend":{
      "space": ["entities_colorlegend"],
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
    }
  },
  "data": {
    "reader": "ddf",
    "splash": false,
    "path": "data/sodertorn",
    "dataset": "Gapminder/ddf--sodertorn"
  },
  "ui": {
    "chart": {
      "labels": {"removeLabelBox": true},
      "trails": false
    }
  }
};


//"{""palette"": {
//""0188_norrtalje"": ""#b100ff"",
//""0191_sigtuna"": ""#7f2fff"",
//""0115_vallentuna"": ""#8f93f0"",
//""0114_upplands_vasby"": ""#59a5ff"",
//""0160_taby"": ""#2b78d3"",
//""0163_sollentuna"": ""#9fd3ff"",
//""0139_upplands_bro"": ""#14be9d"",
//""0125_ekero"": ""#1eebac"",
//""0123_jarfalla"": ""#45ffa9"",
//""0183_sundbyberg"": ""#95dda8"",
//""0117_osteraker"": ""#d005c8"",
//""0187_vaxholm"": ""#ff71f9"",
//""0186_lidingo"": ""#ffaffc"",
//""0162_danderyd"": ""#dde270"",
//""0184_solna"": ""#ebdc8a"",
//""0180_stockholm"": ""#f0c615"",
//""0128_salem"": ""#87e826"",
//""0181_sodertalje"": ""#c2ce2f"",
//""0140_nykvarn"": ""#67a727"",
//""0182_nacka"": ""#ff57cb"",
//""0138_tyreso"": ""#db1b9f"",
//""0120_varmdo"": ""#aa0075"",
//""0126_huddinge"": ""#ff3a3a"",
//""0127_botkyrka"": ""#ed0404"",
//""0136_haninge"": ""#bc6c6c"",
//""0192_nynashamn"": ""#ac0000""
//}}"
