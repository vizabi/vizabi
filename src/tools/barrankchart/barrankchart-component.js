import * as utils from 'base/utils';
import Component from 'base/component';
import axisWithLabelPicker from 'helpers/d3.axisWithLabelPicker';
import {
  question as iconQuestion,
  warn as iconWarn
} from 'base/iconset';

const BarRankChart = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init: function (config, context) {

    this.name = 'barrankchart-component';
    this.template = require('./barrank.html');

    //define expected models for this component
    this.model_expects = [{
      name: 'time',
      type: 'time'
    }, {
      name: 'entities',
      type: 'entities'
    }, {
      name: 'marker',
      type: 'model'
    }, {
      name: 'locale',
      type: 'locale'
    }, {
      name: 'ui',
      type: 'ui'
    }];

    this.model_binds = {
      'change:time.value': () => {
        if (this._readyOnce) {
          this.onTimeChange();
        }
      },
      'change:entities.select': () => {
        if (this._readyOnce) {
          this.selectBars();
          this.updateOpacity();
          this._updateDoubtOpacity();
        }
      },
      'change:marker.axis_x.scaleType': () => {
        if (this._readyOnce) {
          this.draw();
        }
      },
      'change:marker.color.palette': () => {
        this._drawColors();
      },
      'change:entities.highlight': () => {
        this.updateOpacity();
      },
      'change:entities.opacitySelectDim': () => {
        this.updateOpacity();
      },
      'change:entities.opacityRegular': () => {
        this.updateOpacity();
      },
    };

    //contructor is the same as any component
    this._super(config, context);

    // set up the scales
    this.xScale = null;
    this.cScale = d3.scale.category10();

    // set up the axes
    this.xAxis = axisWithLabelPicker();
  },

  onTimeChange: function () {
    this.model.marker.getFrame(this.model.time.value, values => {
      this.values = values;
      this.loadData();
      this.draw();
    });
  },

  /**
   * DOM and model are ready
   */
  readyOnce() {
    this.element = d3.select(this.element);

    // reference elements
    //this.graph = this.element.select('.vzb-br-graph');
    //this.yearEl = this.element.select('.vzb-br-year');
    //this.year = new DynamicBackground(this.yearEl);
    this.header = this.element.select('.vzb-br-header');
    this.infoEl = this.element.select('.vzb-br-axis-info');
    this.barViewport = this.element.select('.barsviewport');
    this.barSvg = this.element.select('.vzb-br-bars-svg');
    this.barContainer = this.element.select('.vzb-br-bars');
    this.dataWarningEl = this.element.select('.vzb-data-warning');
    this.wScale = d3.scale.linear()
      .domain(this.model.ui.datawarning.doubtDomain)
      .range(this.model.ui.datawarning.doubtRange);

    // set up formatters
    this.xAxis.tickFormat(this.model.marker.axis_x.getTickFormatter());

    this._presentation = !this.model.ui.presentation;
    this._formatter = this.model.marker.axis_x.getTickFormatter();

    this.ready();

    this.selectBars();

  },

  /**
   * Both model and DOM are ready
   */
  ready() {
    this.model.marker.getFrame(this.model.time.value, values => {
      this.values = values;
      this.loadData();
      this.draw();
      this.updateOpacity();
    });
  },

  resize: function () {
    this.draw();
  },

  loadData() {
    const _this = this;

    this.translator = this.model.locale.getTFunction();
    // sort the data (also sets this.total)
    this.sortedEntities = this._sortByIndicator(this.values.axis_x);

    this.header
      .select('.vzb-br-title')
      .select('text')
      .on('click', () =>
        this.parent
          .findChildByName('gapminder-treemenu')
          .markerID('axis_x')
          .alignX('left')
          .alignY('top')
          .updateView()
          .toggle()
      );

    // new scales and axes
    this.xScale = this.model.marker.axis_x.getScale(false);
    this.cScale = this.model.marker.color.getScale();

    utils.setIcon(this.dataWarningEl, iconWarn)
      .select('svg')
      .attr('width', 0).attr('height', 0);

    this.dataWarningEl.append('text')
      .text(this.translator('hints/dataWarning'));

    this.dataWarningEl
      .on('click', () => this.parent.findChildByName('gapminder-datawarning').toggle())
      .on('mouseover', () => this._updateDoubtOpacity(1))
      .on('mouseout', () => this._updateDoubtOpacity());

    utils.setIcon(this.infoEl, iconQuestion)
      .select('svg').attr('width', 0).attr('height', 0);

    this.infoEl.on('click', () => {
      this.parent.findChildByName('gapminder-datanotes').pin();
    });

    this.infoEl.on('mouseover', function () {
      const rect = this.getBBox();
      const ctx = utils.makeAbsoluteContext(this, this.farthestViewportElement);
      const coord = ctx(rect.x - 10, rect.y + rect.height + 10);
      _this.parent.findChildByName('gapminder-datanotes')
        .setHook('axis_y')
        .show()
        .setPos(coord.x, coord.y);
    });

    this.infoEl.on('mouseout', function () {
      _this.parent.findChildByName('gapminder-datanotes').hide();
    });

  },

  draw: function () {
    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    //smooth animation is needed when playing, except for the case when time jumps from end to start
    let duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;

    //return if drawAxes exists with error
    if (this.drawAxes(duration)) return;
    this.drawData(duration);
  },

  /*
   * draw the chart/stage
   */
  drawAxes(duration = 0) {
    const profiles = {
      small: {
        margin: { top: 60, right: 20, left: 90, bottom: 10 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 20,
        barMargin: 2,
      },
      medium: {
        margin: { top: 60, right: 20, left: 90, bottom: 15 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 20,
        barMargin: 2,
      },
      large: {
        margin: { top: 60, right: 20, left: 90, bottom: 15 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 20,
        barMargin: 2,
      }
    };

    const presentationProfileChanges = {
      medium: {
        margin: { top: 60, right: 50, left: 90, bottom: 40 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 25,
        infoElMargin: 10,
        barHeight: 25,
        barMargin: 4,
      },
      large: {
        margin: { top: 60, right: 50, left: 90, bottom: 40 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        barHeight: 25,
        infoElMargin: 10,
        barMargin: 4,
      }
    };

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);

    const {
      margin,
      headerMargin,
      infoElHeight,
      infoElMargin,
    } = this.activeProfile;

    // draw the stage - copied from popbyage, should figure out what it exactly does and what is necessary.
    this.height = (parseInt(this.element.style('height'), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style('width'), 10) - margin.left - margin.right) || 0;

    if (this.height <= 0 || this.width <= 0) {
      return utils.warn('Bar rank chart drawAxes() abort: vizabi container is too little or has display:none');
    }

    this.barContainer.attr('transform', `translate(${margin.left}, 0)`);
    this.barViewport.style('height', `${this.height}px`);

    // header
    this.header.attr('height', margin.top);
    const headerTitle = this.header.select('.vzb-br-title');

    // change header titles for new data
    const conceptProps = this.model.marker.getConceptprops();
    const { which } = this.model.marker.axis_x;
    const { name, unit } = conceptProps[which];

    const headerTitleText = headerTitle
      .select('text');

    if (unit) {
      headerTitleText.text(`${name}, ${unit}`);
      const rightEdgeOfLeftText = headerMargin.left + headerTitle.node().getBBox().width + infoElHeight + infoElMargin;
      const leftEdgeOfRightText = this.width + headerMargin.right + headerMargin.left + 30;

      if (rightEdgeOfLeftText > leftEdgeOfRightText) {
        headerTitleText.text(name);
      }
    }

    const headerTitleBBox = headerTitle.node().getBBox();

    const titleTx = headerMargin.left;
    const titleTy = headerMargin.top + headerTitleBBox.height;
    headerTitle
      .attr('transform', `translate(${titleTx}, ${titleTy})`);

    const headerInfo = this.infoEl;

    headerInfo.select('svg')
      .attr('width', `${infoElHeight}px`)
      .attr('height', `${infoElHeight}px`);

    const infoTx = titleTx + headerTitle.node().getBBox().width + infoElMargin;
    const infoTy = headerMargin.top + infoElHeight / 4;
    headerInfo.attr('transform', `translate(${infoTx}, ${infoTy})`);


    const headerTotal = this.header.select('.vzb-br-total');

    if (duration) {
      headerTotal.select('text')
        .transition('text')
        .delay(duration)
        .text(this.model.time.timeFormat(this.time));
    } else {
      headerTotal.select('text')
        .interrupt()
        .text(this.model.time.timeFormat(this.time));
    }

    const headerTotalBBox = headerTotal.node().getBBox();

    const totalTx = this.width + margin.left - headerTotalBBox.width;
    const totalTy = headerMargin.top + headerTotalBBox.height;
    headerTotal
      .attr('transform', `translate(${totalTx}, ${totalTy})`)
      .classed('vzb-transparent', headerTitleBBox.width + headerTotalBBox.width + 10 > this.width);

    const warnBB = this.dataWarningEl.select('text').node().getBBox();
    this.dataWarningEl
      .select('svg')
      .attr('width', warnBB.height)
      .attr('height', warnBB.height)
      .attr('x', warnBB.height * .1)
      .attr('y', -warnBB.height + 1);

    this.dataWarningEl
      .attr('transform', `translate(${this.width + margin.left - warnBB.width - 15}, ${warnBB.height})`)
      .select('text')
      .attr('dx', warnBB.height * 1.5);

    // although axes are not drawn, need the xScale for bar width
    this.xScale.range([0, this.width]);

    this._updateDoubtOpacity();
  },

  drawData(duration = 0) {

    // update the shown bars for new data-set
    this.createAndDeleteBars(
      this.barContainer.selectAll('.vzb-br-bar')
        .data(this.sortedEntities, d => d.entity)
    );

    const { presentation } = this.model.ui;
    const presentationModeChanged = this._presentation !== presentation;

    if (presentationModeChanged) {
      this._presentation = presentation;
    }

    if (
      presentationModeChanged
      || typeof this._entitiesCount === 'undefined'
      || this._entitiesCount !== this.sortedEntities.length
    ) {
      this._entitiesCount = this.sortedEntities.length;
      this.resizeSvgAndScroll();
    }

    const x = presentation ? 35 : 5;
    const barWidth = (value) => this.xScale(value);
    const xValue = (value) => this._formatter(value);

    this.sortedEntities.forEach(bar => {
      const { value } = bar;

      if (presentationModeChanged || bar.isNew) {
        bar.barLabel
          .attr('x', x - 5)
          .attr('y', this.activeProfile.barHeight / 2);

        bar.barRect
          .attr('x', x)
          .attr('rx', this.activeProfile.barHeight / 4)
          .attr('ry', this.activeProfile.barHeight / 4)
          .attr('height', this.activeProfile.barHeight);

        bar.barValue
          .attr('x', x + 5)
          .attr('y', this.activeProfile.barHeight / 2);

        bar.barTitle
          .attr('x', x);
      }

      if (bar.changedWidth || presentationModeChanged) {
        const width = Math.max(0, value && barWidth(Math.abs(value)));

        if (bar.changedWidth) {
          bar.barRect
            .transition().duration(duration).ease('linear')
            .attr('width', width)
        }

        bar.barRect
          .attr('x', x - (value < 0 ? width : 0));

        if (bar.changedValue) {
          bar.barValue
            .text(xValue(value) || this.translator('hints/nodata'));
        }
      }

      if (bar.changedIndex || presentationModeChanged) {
        bar.self
          .transition().duration(duration).ease('linear')
          .attr('transform', `translate(0, ${this._getBarPosition(bar.index)})`);
      }
    });
  },

  resizeSvgAndScroll() {
    const { barHeight, barMargin } = this.activeProfile;
    this.barSvg.attr('height', `${(barHeight + barMargin) * this._entitiesCount}px`);

    // move along with a selection if playing
    if (this.model.time.playing) {
      const follow = this.barContainer.select('.vzb-selected');
      if (!follow.empty()) {
        const d = follow.datum();
        const yPos = this._getBarPosition(d.index);

        const currentTop = this.barViewport.node().scrollTop;
        const currentBottom = currentTop + this.height;

        const scrollTo = yPos < currentTop ?
          yPos :
          yPos + this.activeProfile.barHeight > currentBottom ?
            (yPos + this.activeProfile.barHeight - this.height) :
            false;

        if (scrollTo) {
          this.barViewport.transition().duration(duration)
            .tween('scrollfor' + d.entity, this._scrollTopTween(scrollTo));
        }
      }
    }
  },

  createAndDeleteBars(updatedBars) {
    const _this = this;

    // remove groups for entities that are gone
    updatedBars.exit().remove();

    // make the groups for the entities which were not drawn yet (.data.enter() does this)
    updatedBars.enter()
      .append('g')
      .each(function (d) {
        const self = d3.select(this);
        const color = _this._getColor(d);
        const darkerColor = _this._getDarkerColor(d);

        self.attr('class', 'vzb-br-bar');
        self.attr('id', `vzb-br-bar-${d.entity}-${_this._id}`);
        self.on('mousemove', d => _this.model.entities.highlightEntity(d));
        self.on('mouseout', () => _this.model.entities.clearHighlighted());
        self.on('click', d => {
          utils.forEach(_this.model.marker.space, function (entity) {
            if (_this.model[entity].getDimension() !== 'time')
              _this.model[entity].selectEntity(d); // this will trigger a change in the model, which the tool listens to
          });
        });

        const barRect = self.append('rect')
          .attr('stroke', 'white')
          .attr('stroke-opacity', 0)
          .attr('stroke-width', 2)
          .style('fill', color);

        const barLabel = self.append('text')
          .attr('class', 'vzb-br-label')
          .attr('x', -5)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .text(d => {
            const label = _this.values.label[d.entity];
            return label.length < 12 ? label : label.substring(0, 9) + '...';
          })
          .style('fill', darkerColor);

        const barTitle = barLabel.append('title'); // watch out: might be overwritten if changing the labeltext later on

        const barValue = self.append('text')
          .attr('class', 'vzb-br-value')
          .attr('x', 5)
          .attr('dominant-baseline', 'middle')
          .style('fill', darkerColor);

        Object.assign(d, {
          self,
          barRect,
          barLabel,
          barValue,
          barTitle
        });
      });
  },

  _drawColors() {
    this.barContainer.selectAll('.vzb-br-bar>rect')
      .style('fill', d => this._getColor(d));

    this.barContainer.selectAll('.vzb-br-bar>text')
      .style('fill', d => this._getDarkerColor(d));
  },

  _getColor(d) {
    return d3.rgb(
      this.cScale(
        this.values.color[d.entity]
      )
    );
  },

  _getDarkerColor(d) {
    return this._getColor(d).darker(2);
  },


  /**
   * DATA HELPER FUNCTIONS
   */

  _scrollTopTween(scrollTop) {
    return function () {
      const i = d3.interpolateNumber(this.scrollTop, scrollTop);
      return function (t) {
        this.scrollTop = i(t);
      };
    };
  },

  _getBarPosition(i) {
    return (this.activeProfile.barHeight + this.activeProfile.barMargin) * i;
  },

  _entities: {},

  _sortByIndicator(values) {
    return Object.keys(values).map(entity => {
      const cached = this._entities[entity];
      const value = values[entity];
      const formattedValue = this._formatter(value);

      if (cached) {
        return Object.assign(cached, {
          value,
          formattedValue,
          changedValue: formattedValue !== cached.formattedValue,
          changedWidth: value !== cached.value,
          isNew: false
        });
      }

      return this._entities[entity] = {
        entity,
        value,
        formattedValue,
        [this.model.entities.dim]: entity,
        changedValue: true,
        changedWidth: true,
        isNew: true
      };
    }).sort(({ value: a }, { value: b }) => b - a)
      .map((entity, index) => {
        return Object.assign(entity, {
          index,
          changedIndex: index !== entity.index
        });
      });
  },

  /**
   * UI METHODS
   */


  /**
   * Select Entities
   */
  selectBars: function () {
    const _this = this;
    const entityDim = this.model.entities.dim;
    const selected = this.model.entities.select;

    // unselect all bars
    this.barContainer.classed('vzb-dimmed-selected', false);
    this.barContainer.selectAll('.vzb-br-bar.vzb-selected').classed('vzb-selected', false);

    // select the selected ones
    if (selected.length) {
      this.barContainer.classed('vzb-dimmed-selected', true);
      utils.forEach(selected, function (selectedBar) {
        _this.barContainer.select('#vzb-br-bar-' + selectedBar[entityDim] + '-' + _this._id).classed('vzb-selected', true);
      });
    }

  },

  updateOpacity() {
    const { model: { entities } } =  this;

    const OPACITY_HIGHLIGHT_DEFAULT = 1;
    const {
      highlight,
      select,

      opacityHighlightDim: OPACITY_HIGHLIGHT_DIM,
      opacitySelectDim: OPACITY_SELECT_DIM,
      opacityRegular: OPACITY_REGULAR,
    } = entities;

    const [
      someHighlighted,
      someSelected
    ] = [
      highlight.length > 0,
      select.length > 0
    ];

    this.barContainer.selectAll('.vzb-br-bar')
      .style('opacity', d => {
        if (someHighlighted && entities.isHighlighted(d)) {
          return OPACITY_HIGHLIGHT_DEFAULT;
        }

        if (someSelected) {
          return entities.isSelected(d) ? OPACITY_REGULAR : OPACITY_SELECT_DIM;
        }

        if (someHighlighted) {
          return OPACITY_HIGHLIGHT_DIM;
        }

        return OPACITY_REGULAR;
      });
  },

  _updateDoubtOpacity(opacity) {
    this.dataWarningEl.style('opacity',
      opacity || (
        !this.model.entities.select.length ?
          this.wScale(+this.model.time.value.getUTCFullYear().toString()) :
          1
      )
    );
  },

});

export default BarRankChart;
