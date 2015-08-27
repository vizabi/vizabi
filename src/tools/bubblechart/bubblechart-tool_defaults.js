/*!
 * VIZABI BUBBLECHART DEFAULT OPTIONS
 */

(function () {
  "use strict";
  var BubbleChart = this.Vizabi.Tool.get('BubbleChart');

  BubbleChart.define('default_options', {

    state: {
      time: {
        round: "ceil",
        trails: true,
        lockNonSelected: 0,
        adaptMinMaxZoom: false
      },
      entities: {
        dim: "geo",
        show: {
          _defs_: {
            "geo": ["*"],
            "geo.cat": ["country"]
          }
        }
      },
      marker: {
        space: ["entities", "time"],
        type: "geometry",
        label: {
          use: "property",
          which: "geo.name"
        },
        axis_y: {
          use: "indicator",
          which: "lex"
        },
        axis_x: {
          use: "indicator",
          which: "gdp_per_cap"
        },
        color: {
          use: "property",
          which: "geo.region"
        },
        size: {
          use: "indicator",
          which: "pop"
        }
      }
    },
    data: {
      //reader: "waffle-server",
      reader: "csv-file",
      path: "local_data/waffles/basic-indicators.csv"
    }
  });

}).call(this);
