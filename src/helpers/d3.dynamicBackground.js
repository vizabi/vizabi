//d3.svg.dynamicBackground


import Class from 'base/class'

export default Class.extend({

  init: function (context, conditions) {
    this.context = context;
    this.width = 0;
    this.height = 0;
    this.topOffset = 0;
    this.leftOffset = 0;
    this.bottomOffset = 0;
    this.rightOffset = 0;
    this.textWidth = 0;
    this.textHeight = 0;
    this.widthRatio = 0.9;
    this.heightRatio = 0.9;
    this.xAlign = 'center';
    this.yAlign = 'center';
    this.element = this.context.append('text').style("font-size", '20px');

    this.element.text('0');
    this.letterBBox = this.element.node().getBBox();
    this.element.text('');

    if (conditions) {
      this.setConditions(conditions);
    }
  },

  setConditions: function (conditions) {
    if (!isNaN(parseFloat(conditions.rightOffset)) && isFinite(conditions.rightOffset)) {
      this.rightOffset = conditions.rightOffset;
    }
    if (!isNaN(parseFloat(conditions.leftOffset)) && isFinite(conditions.leftOffset)) {
      this.leftOffset = conditions.leftOffset;
    }
    if (!isNaN(parseFloat(conditions.topOffset)) && isFinite(conditions.topOffset)) {
      this.topOffset = conditions.topOffset;
    }
    if (!isNaN(parseFloat(conditions.bottomOffset)) && isFinite(conditions.bottomOffset)) {
      this.bottomOffset = conditions.bottomOffset;
    }
    if (conditions.xAlign) {
      this.xAlign = conditions.xAlign;
    }
    if (conditions.yAlign) {
      this.yAlign = conditions.yAlign;
    }
    if (!isNaN(parseFloat(conditions.widthRatio)) && conditions.widthRatio > 0 && conditions.widthRatio <= 1) {
      this.widthRatio = conditions.widthRatio;
    }
    if (!isNaN(parseFloat(conditions.heightRatio)) && conditions.heightRatio > 0 && conditions.heightRatio <= 1) {
      this.heightRatio = conditions.heightRatio;
    }
    return this;
  },

  resize: function (width, height, topOffset, leftOffset) {
    [
      this.width,
      this.height
    ] = [
      width,
      height
    ].map(v => Number(String(v).replace('px', '')));

    if (topOffset) {
      this.topOffset = topOffset;
    }
    if (leftOffset) {
      this.leftOffset = leftOffset;
    }

    this._resizeText();
  },

  setText: function (text, delay) {

    setTimeout(() => {
      this.element.selectAll('tspan').remove();
      text.split('').forEach((char, index) => {
        this.element.append('tspan').text(char)
          .attr('x', (index - text.length / 2) * this.letterBBox.width + this.letterBBox.width / 2);
      });

      this._resizeText();
    }, delay);

    return this;

  },

  _resizeText: function () {

    var bbox = {};
    bbox.height = this.element.node().getBBox().height;
    bbox.width =  this.letterBBox.width * this.element.text().length;

    if (!bbox.width || !bbox.height || !this.width || !this.height) return this;

    // method from http://stackoverflow.com/a/22580176
    var widthTransform = this.width * this.widthRatio / bbox.width;
    var heightTransform = this.height * this.heightRatio / bbox.height;
    this.scalar = widthTransform < heightTransform ? widthTransform : heightTransform;
    this.element.attr("transform", "scale("+this.scalar+")");

    this.textHeight = bbox.height * this.scalar;
    this.textWidth = bbox.width * this.scalar;

    switch(this.yAlign) {
      case 'bottom': this.context.style('dominant-baseline', 'central'); break;
      case 'center': this.context.style('dominant-baseline', 'central'); break;
      case 'top': this.context.style('dominant-baseline', 'initial'); break;
    }

    this.context.attr("transform", "translate(" + this._getLeftOffset() + "," + this._getTopOffset() + ")");

    return this;
  },

  _getLeftOffset: function () {
    switch (this.xAlign) {
      case 'right':
        return this.width - this.textWidth / 2 - this.rightOffset;
        break;
      case 'left':
        return this.textWidth / 2 + this.leftOffset;
        break;
      default :
        return this.width / 2;
    }
  },

  _getTopOffset: function () {
    switch (this.yAlign) {
      case 'top':
        return this.textHeight / 2 + this.topOffset;
        break;
      case 'bottom':
        return this.height - this.textHeight / 2 - this.bottomOffset;
        break;
      default :
        return this.height / 2;
    }
  }

});
