define([
    'd3',
    'widgets/widget',
], function(d3, Widget) {
    var barChart = Widget.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this._super(context, options);
        },

        render: function() {
            var height = 500,
                width = 900,
                margin = 50,
                placeholder = d3.select(this.placeholder),
                measures = placeholder.node().getBoundingClientRect(),
                svg = placeholder.append('svg')
                    .attr('height', measures.height)
                    .attr('width', measures.width)
                    .classed(this.name, true)
                    .append('g'),
                x = d3.scale.ordinal().rangeRoundBands([0, width], .1, .3),
                y = d3.scale.linear().range([height, 0]),
                xAxis = d3.svg.axis().scale(x).orient('bottom'),
                yAxis = d3.svg.axis().scale(y).orient('left'),
                translate = this.i18n.translate,
                data = { stats: {} },
                indicator = this.state.yaxis.indicator,
                time = this.state.time;

            var mock = [
                { name: 'Sweden', value: 10 },
                { name: 'Angola', value: 100 },
                { name: 'Magnolia', value: 80 },
                { name: 'Nicole Kidman', value: 50 }
            ];

            var loadEverything = $.when(
              $.ajax(this.state.data.paths.waffle + 'waffle-' + this.state.language + '.json'),
              $.ajax(this.state.data.paths.stats + this.state.yaxis.indicator + '.json'),
              $.ajax(this.state.data.paths.stats + "lex" + '.json')
            ).then(function(waffle, stats, stats2) {
              $.extend(true, data, waffle[0]);
              if (!data.stats[indicator]) data.stats[indicator] = {};
              $.extend(true, data.stats[this.state.yaxis.indicator], stats[0]);
            }.bind(this)).done(function() {
              // Aliases
              var show = parseShowableObjects(this.state.show);
              var indicatorData = data.definitions.indicators[indicator];
              var category = data.definitions.categories;
              var stats = data.stats[indicator];

              x.domain(show.map(function(d) { return category[d.category].things[d.id].name; }));
              y.domain([0, d3.max(d3.entries(stats), function(d) { if (d.value[time]) return d.value[time].v; })]);

              var formatValue = d3.format(".1s");
              yAxis.tickFormat(function(d) { return formatValue(d); })

              svg.append('g')
                  .attr('class', 'y axis')
                  .attr('transform', 'translate(' + margin + ',' + margin + ')')
                  .call(yAxis);

              var chart = svg.selectAll(".bar")
                  .data(show)
                  .enter();

              chart.append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d) { return margin + x(category[d.category].things[d.id].name); })
                  .attr("width", x.rangeBand())
                  .attr("y", function(d) { return margin + 15 + y(stats[d.id][time].v); })
                  .attr("height", function(d) { return height - 15 - y(stats[d.id][time].v); });

              chart.append('text')
                  .classed('bar-title', true)
                  .attr('y', function(d) { return margin + 5 + y(stats[d.id][time].v); })
                  .attr('x', function(d) { return margin + x(category[d.category].things[d.id].name) + (x.rangeBand() / 2); })
                  .text(function(d) { return category[d.category].things[d.id].name; });

              svg.append('g')
                  .attr('class', 'x axis')
                  .attr('transform', 'translate(' + margin + ',' + (margin + height) + ')')
                  .call(xAxis)
                  .selectAll('.tick text')
                  .remove();

              svg.append('text')
                  .attr('class', 'title')
                  .attr('transform', 'translate(' + (margin + 15) + ',' + (margin + 15) + ')')
                  .text(indicatorData.name);
            }.bind(this));
        },

        resize: function() {

        }
    });

    function parseShowableObjects(show) {
      var parsed = [];

      for (var category in show) {
        if ($.isEmptyObject(show[category])) {
          parsed.push({ category: category, id: category });
        } else {
          for (var id in show[category].filter) {
            parsed.push({ category: category, id: show[category].filter[id] });
          }
        }
      }

      return parsed;
    }

    return barChart;
});
