import * as utils from 'base/utils';
import Class from 'base/class';
import { close as iconClose} from 'base/iconset';

var MCSelectList = Class.extend({

  init: function (context) {
    this.context = context;

  },

  rebuild: function (data) {
    var _this = this.context;

    /*
    var listData = _this.mountainPointers
      .concat(_this.groupedPointers)
      .concat(_this.stackedPointers)
      .filter(function (f) {
        return _this.model.entities.isSelected(f);
      }).sort(function (a, b) {
        if (a.sortValue && b.sortValue) {
          if(a.sortValue[1] === b.sortValue[1]) {
            return d3.descending(a.sortValue[0], b.sortValue[0]);
          }
          return d3.descending(a.sortValue[1], b.sortValue[1]);
        } else {
          if (a.aggrLevel != b.aggrLevel) {
            return d3.descending(a.aggrLevel, b.aggrLevel);
          } else if (a.aggrLevel && b.aggrLevel) {
            return d3.descending(a.yMax, b.yMax);
          } else {
            return 0;
          }
        }
      });
    */
    var listData = _this.pointers
      .filter(function (f) {
        return _this.model.entities.isSelected(f);
      });
    _this.selectList = _this.labelListContainer.selectAll("g.vzb-bmc-label")
      .data(utils.unique(listData, function (d) {
        return d.KEY();
      }));
    _this.selectList.exit().remove();
    _this.selectList.enter().append("g")
      .attr("class", "vzb-bmc-label")
      .each(function (d, i) {
        var label = d3.select(this);
        label.append("circle").attr('class', 'vzb-bmc-label-legend');
        label.append("text").attr("class", "vzb-bmc-label-shadow vzb-bmc-label-text");
        label.append("text").attr("class", "vzb-bmc-label-text");
        label.append("g").attr("class", "vzb-bmc-label-x vzb-label-shadow vzb-invisible")
          .on("click", function (d, i) {
            if (utils.isTouchDevice()) return;
            d3.event.stopPropagation();
            _this.model.entities.clearHighlighted();
            _this.model.entities.selectEntity(d);
            d3.event.stopPropagation();
          })
          .onTap(function (d, i) {
            d3.select("#" + d.geo + "-label").remove();
            _this.model.entities.clearHighlighted();
            _this.model.entities.selectEntity(d);
          });
        var labelCloseGroup = label.select("g.vzb-bmc-label-x")
        if (!utils.isTouchDevice()){
          labelCloseGroup
            .html(iconClose)
            .select("svg")
            .attr("class", "vzb-bmc-label-x-icon")
            .attr("width", "0px")
            .attr("height", "0px");

          labelCloseGroup.insert("circle", "svg");

        } else {
          labelCloseGroup.append("rect");
          labelCloseGroup.append("text")
            .attr("class", "vzb-bmc-label-x-text")
            .text("Deselect");
        }
      })
      .on("mousemove", function (d, i) {
        if (utils.isTouchDevice()) return;
        _this.model.entities.highlightEntity(d);
      })
      .on("mouseout", function (d, i) {
        if (utils.isTouchDevice()) return;
        _this.model.entities.clearHighlighted();

      })
      .on("click", function (d, i) {
        if (utils.isTouchDevice()) return;
        _this.model.entities.clearHighlighted();
        _this.model.entities.selectEntity(d);
      });
  },

  redraw: function () {
    var _this = this.context;
    if (!_this.selectList || !_this.someSelected) return;

    var sample = _this.labelListContainer.append("g").attr("class", "vzb-bmc-label").append("text").text("0");
    var fontHeight = sample[0][0].getBBox().height*1.2;
    var fontSizeToFontHeight = parseFloat(sample.style("font-size")) / fontHeight;
    d3.select(sample[0][0].parentNode).remove();
    var formatter = _this.model.marker.size.tickFormatter;

    var titleHeight = _this.yTitleEl.select("text").node().getBBox().height || 0;

    var maxFontHeight = (_this.height - titleHeight * 3) / (_this.selectList.data().length + 2);
    if(fontHeight > maxFontHeight) fontHeight = maxFontHeight;

    _this.selectList
      .attr("transform", function (d, i) {
        var spacing = fontHeight * i + titleHeight * 1.5 + fontHeight;
        return "translate(0," + spacing + ")";
      })
      .each(function (d, i) {

        var view = d3.select(this).attr("id", d.geo + '-label');
        var name = d.key ? _this.translator("region/" + d.key) : _this.values.label[d.KEY()];
        //var number = _this.values.axis_y[d.KEY()];
        var number = _this.values.size[d.KEY()];

        var string = name + ": " + formatter(number) + (i === 0 ? " " + _this.translator("unit/" + _this.model.marker.size.which) : "");

        var text = view.selectAll(".vzb-bmc-label-text")
          .attr("x", fontHeight)
          .attr("y", fontHeight)
          .text(string)
          .style("font-size", fontHeight === maxFontHeight ? (fontHeight * fontSizeToFontHeight + "px") : null);

        var contentBBox = text[0][0].getBBox();

        var closeGroup = view.select(".vzb-bmc-label-x");

        if (utils.isTouchDevice()) {
          var closeTextBBox = closeGroup.select("text").node().getBBox();
          closeGroup
            .classed("vzb-revert-color", true)
            .select(".vzb-bmc-label-x-text")
            .classed("vzb-revert-color", true)
            .attr("x", contentBBox.width + contentBBox.height * 1.12 + closeTextBBox.width * .5)
            .attr("y", contentBBox.height * .55);

          closeGroup.select("rect")
            .attr("width", closeTextBBox.width + contentBBox.height * .6)
            .attr("height", contentBBox.height)
            .attr("x", contentBBox.width + contentBBox.height * .9)
            .attr("y", 0)
            .attr("rx", contentBBox.height * .25)
            .attr("ry", contentBBox.height * .25);
        } else {
          closeGroup
            .attr("x", contentBBox.width + contentBBox.height * 1.1)
            .attr("y", contentBBox.height / 3);

          closeGroup.select("circle")
            .attr("r", contentBBox.height * .4)
            .attr("cx", contentBBox.width + contentBBox.height * 1.1)
            .attr("cy", contentBBox.height / 3);

          closeGroup.select("svg")
            .attr("x", contentBBox.width + contentBBox.height * (1.1 - .4))
            .attr("y", contentBBox.height * (1 / 3 - .4))
            .attr("width", contentBBox.height * .8)
            .attr("height", contentBBox.height * .8);
        }

        view.select(".vzb-bmc-label-legend")
          .attr("r", fontHeight / 3)
          .attr("cx", fontHeight * .4)
          .attr("cy", fontHeight / 1.5)
          .style("fill", _this.cScale(_this.values.color[d.KEY()]));

        view.onTap(function (d, i) {
          d3.event.stopPropagation();
          _this.model.entities.highlightEntity(d);
          setTimeout(function() {
            _this.model.entities.unhighlightEntity(d);
          }, 2000)
        });
      });
  }
});

export default MCSelectList;
