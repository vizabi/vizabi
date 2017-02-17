import * as utils from "base/utils";
import Component from "base/component";

const DraggableList = Component.extend({

  init(config, context) {
    this.template = '<span class="vzb-dl-holder"><ul class="vzb-draggable list vzb-dialog-scrollable"></ul></span>';
    const _this = this;
    this.name = "draggableList";

    this.dataArrFn = config.dataArrFn;
    this.lang = config.lang;

    this.model_expects = [{
      name: "group",
      type: "model"
    }, {
      name: "color",
      type: "color"
    }, {
      name: "locale",
      type: "locale"
    }, {
      name: "chart",
      type: "model"
    }];

    this.groupID = config.groupID;
    this.isEnabled = config.isEnabled;
    this.draggable = true;

    if (!config.groupID) utils.warn("draggablelist.js complains on 'groupID' property: " + config.groupID);

    this.model_binds = {
      "translate:locale": function(evt) {
        _this.updateView();
      },
      "change:group.which": function(evt) {
        _this.updateView();
      }
    };

    this.model_binds["change:group." + this.groupID] = function(evt) {
      _this.updateView();
    };
    this.model_binds["change:chart." + this.isEnabled] = function(evt) {
      _this.draggable = _this.model.chart[_this.isEnabled];
      _this.updateView();
    };


    this._super(config, context);

    this.updateData = utils.debounce(this.updateData, 1000);

    this.itemDragger = d3.drag()
      .on("start", (draggedData, i) => {
        if (_this.dataUpdateFlag || !_this.draggable) return;
        d3.event.sourceEvent.stopPropagation();
        _this.parentBoundRect = _this.element.node().getBoundingClientRect();
        _this.element
          .selectAll("div")
          .each(function(d, i) {
            const boundRect = this.getBoundingClientRect();
            d._y = boundRect.top;
            d._top = 0;
            if (draggedData.data === d.data) {
              d._height = boundRect.height;
              _this.selectedNode = this;
            }
          });
        d3.select(_this.selectedNode)
          .classed("dragged", true);
      })

      .on("drag", (draggedData, draggedIndex) => {
        if (_this.dataUpdateFlag || !_this.draggable) return;
        draggedData._top += d3.event.dy;
        const newDraggedY = draggedData._y + draggedData._top;
        if (newDraggedY > _this.parentBoundRect.top
          && newDraggedY + draggedData._height < _this.parentBoundRect.top + _this.parentBoundRect.height)
        {
          _this.itemsEl
            .style("top", (d, i) => {
              let top = 0;

              if (i < draggedIndex && d._y + draggedData._height * 0.5 > newDraggedY) {
                top = draggedData._height;
              }
              else if (i > draggedIndex && d._y - draggedData._height * 0.5 < newDraggedY) {
                top = -draggedData._height;
              }

              if (i != draggedIndex) d._top = top;
              return d._top + "px";
            });
        }
      })

      .on("end", (d, i) => {
        if (_this.dataUpdateFlag || !_this.draggable) return;
        _this.getData();
      });

  },

  ready() {
    const _this = this;

    const labels = _this.model.color.getColorlegendMarker().label.getItems();
    this.dataArrFn(utils.keys(labels));

    this.updateView();

    this.itemsEl = this.element
      .selectAll("div");

    this.itemsEl
      .call(_this.itemDragger);

    const test = this.itemsEl.select("li")
      .on("mouseover", function() {
        d3.select(this).classed("hover", true);
      })
      .on("mouseout", function() {
        d3.select(this).classed("hover", false);
      })
      .on("touchstart", () => {
        d3.event.preventDefault();
      });

  },

  updateView() {
    const _this = this;

    this.items = this.element.selectAll("div").data(() => _this.dataArrFn().map(d => ({ data: d })));
    this.items.exit().remove();
    this.items = this.items.enter()
      .append("div")
      .append("li")
      .merge(this.items);

    const labels = _this.model.color.getColorlegendMarker().label.getItems();
    this.items.select("li").classed("hover", false).each(function(val, index) {
      d3.select(this).attr("data", val["data"]).text(labels[val["data"]]);
    });

    const draggable = _this.draggable ? true : null;
    this.element.selectAll("div")
      .style("top", "")
      .attr("draggable", draggable)
      .classed("dragged", false);
    this.dataUpdateFlag = false;

  },

  getData() {
    let dataArr = [];
    const data = this.element
      .selectAll("div").data();

    dataArr = data
      .sort((a, b) => (a._y + a._top) - (b._y + b._top))
      .map(d => d.data);
    if (utils.arrayEquals(this.dataArrFn(), dataArr)) {
      this.updateView();
    } else {
      this.dataUpdateFlag = true;
      this.updateData(dataArr);
    }
  },

  updateData(dataArr) {
    this.dataArrFn(dataArr);
  },

  readyOnce() {
    const _this = this;

    this.element = d3.select(this.element).select(".list");

  }

});

export default DraggableList;
