import Class from "base/class";

const TextEllipsis = Class.extend({

  init(context) {
    this.context = context;
    this.interact = this._createInteract();
  },

  setTooltip(tooltip) {
    this.tooltip = tooltip;
  },

  _createInteract() {
    const _this = this;
    return {
      mouseOver() {
        const evt = d3.event;
        const mouse = d3.mouse(_this.context.element.node());
        _this._setTooltip(d3.select(evt.target).attr("data-text"), mouse[0], mouse[1]);
      },
      mouseOut() {
        _this._setTooltip();
      },
      tap() {

      }
    };
  },

  _setTooltip(tooltipText, x, y) {
    if (tooltipText) {

      //position tooltip
      this.tooltip.classed("vzb-hidden", false)
      //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
        .selectAll("text")
        .text(tooltipText);

      const contentBBox = this.tooltip.select("text").node().getBBox();
      if (x - contentBBox.width < 0) {
        x += contentBBox.width + 5; // corrective to the block Radius and text padding
      } else {
        x -= 5; // corrective to the block Radius and text padding
      }
      if (y - contentBBox.height < 0) {
        y += contentBBox.height;
      } else {
        y -= 11; // corrective to the block Radius and text padding
      }

      this.tooltip.attr("transform", "translate(" + x + "," + y + ")");

      this.tooltip.selectAll("rect")
        .attr("width", contentBBox.width + 8)
        .attr("height", contentBBox.height * 1.2)
        .attr("x", -contentBBox.width - 4)
        .attr("y", -contentBBox.height * 0.85)
        .attr("rx", contentBBox.height * 0.2)
        .attr("ry", contentBBox.height * 0.2);

    } else {
      this.tooltip.classed("vzb-hidden", true);
    }
  },

  clear(selection) {
    selection.attr("data-text", null);
  },

  wrap(_this, width) {
    const textEl = d3.select(_this);

    const abs = Math.abs;
    let initialText = textEl.attr("data-text");
    if (!initialText) {
      initialText = textEl.text();
      textEl.attr("data-text", initialText);
    }
    textEl.text(initialText);
    let text = initialText;
    let textLength = text.length;
    let textWidth = textEl.node().getComputedTextLength();

    while (width - textWidth <= 0 && text !== "") {
      text = (textWidth >= width) ? text.slice(0, -abs(textLength * 0.5)) : initialText.slice(0, abs(textLength * 0.5));
      textEl.text(text + "…");
      textWidth = textEl.node().getComputedTextLength();
      textLength = text.length;
    }

    if (text !== initialText) {
      if (text === "") {
        textEl.text(initialText[0]);
      }
      textEl
        .on("mouseover.tooltip", this.interact.mouseOver)
        .on("mouseout.tooltip", this.interact.mouseOut)
        .style("pointer-events", "all");
    } else {
      textEl
        .on("mouseover.tooltip", null)
        .on("mouseout.tooltip", null)
        .style("pointer-events", null);
    }
  }

});

export default TextEllipsis;
