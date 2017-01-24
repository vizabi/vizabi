import Component from 'base/component';

const SteppedSlider = Component.extend({

  init(config, context) {
    this.name = 'steppedSlider';
    this.template = require('./steppedspeedslider.html');

    this.config = Object.assign({
      triangleWidth: 10,
      triangleHeight: 10,
      height: 30,
      lineWidth: 10
    }, config);

    this.model_expects = [
      {
        name: 'time',
        type: 'time'
      }
    ];

    this.model_binds = {
      'change:time.delay': (...args) => {
        console.log(...args);
      }
    };

    this._super(config, context);
  },

  readyOnce() {
    this.element = d3.select(this.element);
    this.svg = this.element.select('svg');

    this.slide = this.svg.append('g');

    this.slide
      .append('path')
      .attr('d', this.getTrianglePath());


    const scale = d3.scale.log()
      .base(10)
      .domain([1, 10])
      .range([this.config.height, 0]);


    const _scale = d3.scale.linear()
      .domain([0, 100])
      .range([-100, 100]);


    const self = this;
    this.brush = d3.svg.brush()
      .y(_scale)
      .on('brush', function () {
        const [dx, dy] = d3.mouse(this);
        const [tx, ty] = d3.transform(self.slide.attr('transform')).translate;
        const y = Math.max(0, Math.min(dy + ty, self.config.height));
        const value = scale.invert(y);
        self.slide.attr('transform', `translate(0, ${y})`);

        console.log({ dy, ty, y, value });
      });

    this.slide.call(this.brush);

    const axis = d3.svg.axis()
      .scale(scale)
      .tickFormat(() => '')
      .orient('left')
      // .ticks(2, ',.1s')
      .tickSize(this.config.lineWidth, 0);

    this.svg.append('g')
      .attr('transform', `translate(${this.config.triangleWidth + 10}, ${this.config.triangleHeight / 2})`)
      .call(axis);
  },

  getTrianglePath() {
    const {
      triangleHeight,
      triangleWidth
    } = this.config;

    return `M ${triangleWidth},` +
      `${triangleHeight / 2} 0,` +
      `${triangleHeight} 0,0 z`;
  }

});

export default SteppedSlider;
