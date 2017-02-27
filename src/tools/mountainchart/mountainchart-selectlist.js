import * as utils from "base/utils";
import Class from "base/class";
import { close as iconClose } from "base/iconset";

const MCSelectList = Class.extend({

  init(context) {
    this.context = context;

  },

  rebuild(data) {
    const _this = this.context;
    const _local = this;

    const listData = _this.mountainPointers
      .concat(_this.groupedPointers)
      .concat(_this.stackedPointers)
      .filter(f => _this.model.marker.isSelected(f)).sort((a, b) => {
        if (a.sortValue && b.sortValue) {
          if (a.sortValue[1] === b.sortValue[1]) {
            return d3.descending(a.sortValue[0], b.sortValue[0]);
          }
          return d3.descending(a.sortValue[1], b.sortValue[1]);
        }

        if (a.aggrLevel != b.aggrLevel) {
          return d3.descending(a.aggrLevel, b.aggrLevel);
        } else if (a.aggrLevel && b.aggrLevel) {
          return d3.descending(a.yMax, b.yMax);
        }

        return 0;
      });
    _this.selectList = _this.mountainLabelContainer.selectAll("g.vzb-mc-label")
      .data(utils.unique(listData, d => d.KEY()));
    _this.selectList.exit().remove();
    _this.selectList = _this.selectList.enter().append("g")
      .attr("class", "vzb-mc-label")
      .each(function(d, i) {
        const label = d3.select(this);
        label.append("circle").attr("class", "vzb-mc-label-legend");
        label.append("text").attr("class", "vzb-mc-label-shadow vzb-mc-label-text");
        label.append("text").attr("class", "vzb-mc-label-text");
        label.append("g").attr("class", "vzb-mc-label-x vzb-label-shadow vzb-invisible")
          .on("click", (d, i) => {
            if (utils.isTouchDevice()) return;
            d3.event.stopPropagation();
            _this.model.marker.clearHighlighted();
            _this.model.marker.selectMarker(d);
            d3.event.stopPropagation();
          })
          .onTap((d, i) => {
            d3.select("#" + d.geo + "-label-" + _this._id).remove();
            _this.model.marker.clearHighlighted();
            _this.model.marker.selectMarker(d);
          });
        const labelCloseGroup = label.select("g.vzb-mc-label-x");
        if (!utils.isTouchDevice()) {
          utils.setIcon(labelCloseGroup, iconClose)
            .select("svg")
            .attr("class", "vzb-mc-label-x-icon")
            .attr("width", "0px")
            .attr("height", "0px");

          labelCloseGroup.insert("circle", "svg");

        } else {
          labelCloseGroup.append("rect");
          labelCloseGroup.append("text")
            .attr("class", "vzb-mc-label-x-text")
            .text("Deselect");
        }
      })
      .on("mousemove", (d, i) => {
        if (utils.isTouchDevice()) return;
        _local.showCloseCross(d, true);
        _this.model.marker.highlightMarker(d);
      })
      .on("mouseout", (d, i) => {
        if (utils.isTouchDevice()) return;
        _local.showCloseCross(d, false);
        _this.model.marker.clearHighlighted();

      })
      .on("click", (d, i) => {
        if (utils.isTouchDevice()) return;
        _this.model.marker.clearHighlighted();
        _this.model.marker.selectMarker(d);
      })
      .merge(_this.selectList);
  },

  redraw() {
    const _this = this.context;
    if (!_this.selectList || !_this.someSelected) return;

    const sample = _this.mountainLabelContainer.append("g").attr("class", "vzb-mc-label").append("text").text("0");
    let fontHeight = sample.node().getBBox().height * 1.2;
    const fontSizeToFontHeight = parseFloat(sample.style("font-size")) / fontHeight;
    d3.select(sample.node().parentNode).remove();
    const formatter = _this.model.marker.axis_y.getTickFormatter();

    const titleHeight = _this.yTitleEl.select("text").node().getBBox().height || 0;

    const maxFontHeight = (_this.height - titleHeight * 3) / (_this.selectList.data().length + 2);
    if (fontHeight > maxFontHeight) fontHeight = maxFontHeight;

    let currentAggrLevel = "null";
    let aggrLevelSpacing = 0;

    const groupLabels = _this.model.marker.color.getColorlegendMarker().label.getItems();

    const isRTL = _this.model.locale.isRTL();

    _this.selectList
      .attr("transform", (d, i) => {
        if (d.aggrLevel != currentAggrLevel) aggrLevelSpacing += fontHeight;
        const spacing = fontHeight * i + titleHeight * 1.5 + aggrLevelSpacing;
        currentAggrLevel = d.aggrLevel;
        return "translate(" + (isRTL ? _this.width : 0) + "," + spacing + ")";
      })
      .each(function(d, i) {

        const view = d3.select(this).attr("id", d.geo + "-label-" + _this._id);
        let name = "";
        if (d.key) {
          name = d.key === "all" ? _this.translator("mount/merging/world") : groupLabels[d.key];
        } else {
          name = _this.values.label[d.KEY()];
        }

        const number = _this.values.axis_y[d.KEY()];

        const string = name + ": " + formatter(number) + (i === 0 ? " " + _this.translator("mount/people") : "");

        const text = view.selectAll(".vzb-mc-label-text")
          .attr("x", (isRTL ? -1 : 1) * fontHeight)
          .attr("y", fontHeight)
          .text(string)
          .style("font-size", fontHeight === maxFontHeight ? (fontHeight * fontSizeToFontHeight + "px") : null);

        const contentBBox = text.node().getBBox();

        const closeGroup = view.select(".vzb-mc-label-x");

        if (utils.isTouchDevice()) {
          const closeTextBBox = closeGroup.select("text").node().getBBox();
          closeGroup
            .classed("vzb-revert-color", true)
            .select(".vzb-mc-label-x-text")
            .classed("vzb-revert-color", true)
            .attr("x", contentBBox.width + contentBBox.height * 1.12 + closeTextBBox.width * 0.5)
            .attr("y", contentBBox.height * 0.55);

          closeGroup.select("rect")
            .attr("width", closeTextBBox.width + contentBBox.height * 0.6)
            .attr("height", contentBBox.height)
            .attr("x", contentBBox.width + contentBBox.height * 0.9)
            .attr("y", 0)
            .attr("rx", contentBBox.height * 0.25)
            .attr("ry", contentBBox.height * 0.25);
        } else {
          closeGroup
            .attr("x", contentBBox.width + contentBBox.height * 1.1)
            .attr("y", contentBBox.height / 3);

          closeGroup.select("circle")
            .attr("r", contentBBox.height * 0.4)
            .attr("cx", (isRTL ? -1 : 1) * (contentBBox.width + contentBBox.height * 1.1))
            .attr("cy", contentBBox.height / 3);

          closeGroup.select("svg")
            .attr("x", (isRTL ? -1 : 1) * (contentBBox.width + contentBBox.height * (1.1 - (isRTL ? -0.4 : 0.4))))
            .attr("y", contentBBox.height * (1 / 3 - 0.4))
            .attr("width", contentBBox.height * 0.8)
            .attr("height", contentBBox.height * 0.8);
        }

        view.select(".vzb-mc-label-legend")
          .attr("r", fontHeight / 3)
          .attr("cx", (isRTL ? -1 : 1) * fontHeight * 0.4)
          .attr("cy", fontHeight / 1.5)
          .style("fill", _this.cScale(_this.values.color[d.KEY()]));

        view.onTap((d, i) => {
          d3.event.stopPropagation();
          _this.model.marker.highlightMarker(d);
          setTimeout(() => {
            _this.model.marker.unhighlightMarker(d);
          }, 2000);
        });
      });
  },

  showCloseCross(d, show) {
    const _this = this.context;
    const KEY = _this.KEY;
    //show the little cross on the selected label
    _this.selectList
      .filter(f => f[KEY] == d[KEY])
      .select(".vzb-mc-label-x")
      .classed("vzb-invisible", !show);
  },

});

export default MCSelectList;
