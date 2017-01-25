import Component from 'base/component';
import { throttle } from 'base/utils';

const SteppedSlider = Component.extend({

  init(config, context) {
    this.name = 'steppedSlider';
    this.template = require('./steppedspeedslider.html');

    this.config = Object.assign({
      triangleWidth: 10,
      triangleHeight: 10,
      height: 20,
      lineWidth: 10,
      domain: [1, 2, 3, 4, 5, 6],
      range: [1200, 900, 450, 200, 150, 100]
    }, config);

    this.model_expects = [
      {
        name: 'time',
        type: 'time'
      },
      {
        name: 'locale',
        type: 'locale'
      }
    ];

    this.model_binds = {
      'change:time.delay': () => {
        this.redraw();
      }
    };

    this.setDelay = throttle(this.setDelay, 50);

    this._super(config, context);
  },

  readyOnce() {
    this.element = d3.select(this.element);
    this.svg = this.element.select('svg');
    this.slide = this.svg.select('.vzb-stepped-speed-slider-triangle');

    this.slide
      .append('path')
      .attr('d', this.getTrianglePath());

    this.axisScale = d3.scale.log()
      .domain(d3.extent(this.config.domain))
      .range([this.config.height, 0]);

    const axis = d3.svg.axis()
      .scale(this.axisScale)
      .tickFormat(() => '')
      .orient('left')
      .tickSize(this.config.lineWidth, 0);

    this.svg.select('.vzb-stepped-speed-slider-axis')
      .attr('transform', `translate(${this.config.triangleWidth + this.config.lineWidth / 2}, ${this.config.triangleHeight / 2})`)
      .call(axis);

    this.delayScale = d3.scale.linear()
      .domain(this.config.domain)
      .range(this.config.range);

    this.drag = d3.behavior.drag()
      .on('drag', () => {
        const { dy } = d3.event;
        const [, ty] = d3.transform(this.slide.attr('transform')).translate;
        const y = Math.max(0, Math.min(dy + ty, this.config.height));

        this.setDelay(Math.round(this.delayScale(this.axisScale.invert(y))));
      })
      .on('dragend', () => {
        this.setDelay(this.model.time.delay, true, true);
      });

    this.slide.call(this.drag);

    this.redraw();
  },

  getTrianglePath() {
    const {
      triangleHeight,
      triangleWidth
    } = this.config;

    return `M ${triangleWidth},${triangleHeight / 2} 0,${triangleHeight} 0,0 z`;
  },

  setDelay(value, force = false, persistent = false) {
    this.model.time.set('delay', value, force, persistent);
  },

  redraw(y = this.axisScale(this.delayScale.invert(this.model.time.delay))) {
    this.slide.attr('transform', `translate(0, ${y})`);
  }

});

export default SteppedSlider;
