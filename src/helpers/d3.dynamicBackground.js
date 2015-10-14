//d3.svg.worldMap
import Class from '../base/class'

export default Class.extend({

  init: function(context) {
    this.context = context;
    this.width = 0;
    this.height = 0;
    this.topOffset = 0;
    this.leftOffset = 0;
    this.fontSize = 0;
    this.xAlign = 'center';
    this.yAlign = 'center';
    this.symbols = [];
  },

  resize: function(width, height, fontSize, topOffset, leftOffset) {
    this.width = width;
    this.height = height;
    this.fontSize = fontSize;
    if (topOffset) {
      this.topOffset = topOffset;
    }
    if (leftOffset) {
      this.leftOffset = leftOffset;
    }

    this.__resizeText();
  },

  setText: function(text, resize) {
    var _this = this;
    var newSymbols = text.split('');
    if (newSymbols.length != this.symbols.length) {
      resize = true;
    }
    this.symbols = text.split('');

    this.context.selectAll("text")
      .data(this.symbols).exit().remove();
    this.context.selectAll("text")
      .data(this.symbols)
      .enter()
      .append("text")
      .text(function(d){return d;});

    this.context.selectAll("text").each(function (d, i) {
        d3.select(this).text(d);
    });
    console.log(this.width);
    console.log(this.height);
    if (resize) {
      this.__resizeText();
    }
  },

  __resizeText: function() {
    var _this = this;
    var sample = this.context.append("text").text("0").style("font-size", this.fontSize + "px");
    var fontWidth = sample[0][0].getBBox().width;
    var fontHeight = this.fontSize*0.72;
    var translateY = fontHeight + (this.height - fontHeight)/2;
    d3.select(sample[0][0]).remove();
    this.context.attr("transform", "translate(" + (fontWidth/2 + (this.width - fontWidth*this.symbols.length)/2) + "," + translateY + ")");
    this.context.selectAll("text").each(function(d, i) {
        d3.select(this)
          .attr("x", fontWidth * i)
          .style("font-size", _this.fontSize)
          .style("text-anchor", "middle");
      });
  }
});
