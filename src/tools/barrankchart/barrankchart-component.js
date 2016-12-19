import * as utils from 'base/utils';
import Component from 'base/component';
import axisWithLabelPicker from 'helpers/d3.axisWithLabelPicker';
import {
  question as iconQuestion,
  warn as iconWarn
} from 'base/iconset';

const COLOR_BLACKISH = "#333";
const COLOR_WHITEISH = "#fdfdfd";

const BarRankChart = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init(config, context) {

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
      'change:marker.select': () => {
        if (this._readyOnce) {
          this._selectBars();
          this._updateOpacity();
          this._updateDoubtOpacity();
        }
      },
      'change:marker.axis_x.scaleType': () => {
        if (this._readyOnce) {
          this.loadData();
          this.draw(true);
        }
      },
      'change:marker.color.palette': () => {
        this._drawColors();
      },
      'change:marker.highlight': () => {
        this._updateOpacity();
      },
      'change:marker.opacitySelectDim': () => {
        this._updateOpacity();
      },
      'change:marker.opacityRegular': () => {
        this._updateOpacity();
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

  onTimeChange() {
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
    this.barViewport = this.element.select('.vzb-br-barsviewport');
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

    this._selectBars();

  },

  /**
   * Both model and DOM are ready
   */
  ready() {
    this.model.marker.getFrame(this.model.time.value, values => {

      this.values = values;
      this.loadData();
      this.draw(true);
      this._updateOpacity();
      this._drawColors();
    });
  },

  resize() {
    this.draw(true);
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
    this.xScale = this.model.marker.axis_x.getScale();
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

  draw(force = false) {
    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    //smooth animation is needed when playing, except for the case when time jumps from end to start
    const duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;

    //return if drawAxes exists with error
    if (this.drawAxes(duration, force)) return;
    this.drawData(duration, force);
  },

  /*
   * draw the chart/stage
   */
  drawAxes(duration = 0) {
    const profiles = {
      small: {
        margin: { top: 60, right: 5, left: 5, bottom: 20 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 20,
        barMargin: 3,
        barRectMargin: 5,
        barValueMargin: 5,
        scrollMargin: 20,
      },
      medium: {
        margin: { top: 60, right: 5, left: 5, bottom: 20 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 20,
        barMargin: 3,
        barRectMargin: 5,
        barValueMargin: 5,
        scrollMargin: 25,
      },
      large: {
        margin: { top: 60, right: 5, left: 5, bottom: 20 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 20,
        barMargin: 3,
        barRectMargin: 5,
        barValueMargin: 5,
        scrollMargin: 25,
      }
    };

    const presentationProfileChanges = {
      medium: {
        margin: { top: 60, right: 10, left: 10, bottom: 40 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 25,
        infoElMargin: 10,
        barHeight: 25,
        barMargin: 6
      },
      large: {
        margin: { top: 60, right: 10, left: 10, bottom: 40 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        barHeight: 25,
        infoElMargin: 10,
        barMargin: 6
      }
    };

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);

    const {
      margin,
      headerMargin,
      infoElHeight,
      infoElMargin,
    } = this.activeProfile;

    this.height = +this.element.style('height').replace('px', '');
    this.width = +this.element.style('width').replace('px', '');

    this.barViewport
      .style('height', `${this.height - margin.bottom - margin.top}px`);

    // header
    this.header.attr('height', margin.top);
    const headerTitle = this.header.select('.vzb-br-title');

    // change header titles for new data
    const { name, unit } = this.model.marker.axis_x.getConceptprops();

    const headerTitleText = headerTitle
      .select('text');

    if (unit) {
      headerTitleText.text(`${name}, ${unit}`);

      const rightEdgeOfLeftText = headerMargin.left
        + headerTitle.node().getBBox().width
        + infoElMargin
        + infoElHeight;

      if (rightEdgeOfLeftText > this.width - headerMargin.right) {
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

    const totalTx = this.width - headerMargin.right - headerTotalBBox.width;
    const totalTy = headerMargin.top + headerTotalBBox.height;
    headerTotal
      .attr('transform', `translate(${totalTx}, ${totalTy})`)
      .classed('vzb-transparent', headerTitleBBox.width + headerTotalBBox.width + 10 > this.width);

    this.element.select('.vzb-data-warning-svg')
      .style('height', `${margin.bottom}px`);


    const warningBBox = this.dataWarningEl.select('text').node().getBBox();
    this.dataWarningEl
      .attr('transform', `translate(${this.width - margin.right - warningBBox.width}, ${warningBBox.height})`)
      .select('text');

    this.dataWarningEl
      .select('svg')
      .attr('width', warningBBox.height)
      .attr('height', warningBBox.height)
      .attr('x', -warningBBox.height - 5)
      .attr('y', -warningBBox.height + 1);

    this._updateDoubtOpacity();
  },

  drawData(duration = 0, force = false) {
    // update the shown bars for new data-set
    this._createAndDeleteBars(
      this.barContainer.selectAll('.vzb-br-bar')
        .data(this.sortedEntities, d => d.entity)
    );


    const { presentation } = this.model.ui;
    const presentationModeChanged = this._presentation !== presentation;

    if (presentationModeChanged) {
      this._presentation = presentation;
    }


    const entitiesCountChanged = typeof this._entitiesCount === 'undefined'
      || this._entitiesCount !== this.sortedEntities.length;

    if (presentationModeChanged || entitiesCountChanged) {
      if (entitiesCountChanged) {
        this._entitiesCount = this.sortedEntities.length;
      }
      this._resizeSvg();
    }


    // move along with a selection if playing
    if (this.model.time.playing) {
      this._scroll(duration);
    }

    const { barRectMargin, barValueMargin, scrollMargin, margin } = this.activeProfile;
    const { axis_x } = this.model.marker;
    const limits = axis_x.getLimits(axis_x.which);
    const ltr = Math.abs(limits.max) >= Math.abs(limits.min);


    const rightEdge = this.width
      - margin.right
      - margin.left
      - this._getWidestLabelWidth()
      - barRectMargin
      - scrollMargin;
    this.xScale.range([0, rightEdge]);

    let zeroValueWidth = this.xScale(0) || 0;
    let shift = this._getWidestLabelWidth();

    if (zeroValueWidth > ((ltr ? margin.left : margin.right) + this._getWidestLabelWidth())) {
      shift = zeroValueWidth;
    }

    if (zeroValueWidth < 0) {
      this.xScale.range([0, rightEdge - Math.abs(zeroValueWidth)]);
      zeroValueWidth = this.xScale(0) || 0;
    }

    const barWidth = (value) => this.xScale(value) - zeroValueWidth;

    const labelAnchor = ltr ? 'end' : 'start';
    const valueAnchor = ltr ? 'start' : 'end';

    const labelX = ltr ?
      (margin.left + shift) :
      (this.width - shift - scrollMargin - margin.right);

    const barX = ltr ?
      (labelX + barRectMargin) :
      (labelX - barRectMargin);

    const valueX = ltr ?
      (barX + barValueMargin) :
      (barX - barValueMargin);

    const isLabelBig = (this._getWidestLabelWidth(true) + (ltr ? margin.left : margin.right)) < shift;
    this.sortedEntities.forEach((bar) => {
      const { value } = bar;

      if (force || presentationModeChanged || bar.isNew) {
        bar.barLabel
          .attr('x', labelX)
          .attr('y', this.activeProfile.barHeight / 2)
          .attr('text-anchor', labelAnchor)
          .text(isLabelBig ? bar.labelFull : bar.labelSmall);

        bar.barRect
          .attr('rx', this.activeProfile.barHeight / 4)
          .attr('ry', this.activeProfile.barHeight / 4)
          .attr('height', this.activeProfile.barHeight);

        bar.barValue
          .attr('x', valueX)
          .attr('y', this.activeProfile.barHeight / 2)
          .attr('text-anchor', valueAnchor);
      }

      if (force || bar.changedWidth || presentationModeChanged) {
        const width = Math.max(0, value && barWidth(Math.abs(value)));

        if (force || bar.changedWidth || presentationModeChanged) {
          bar.barRect
            .transition().duration(duration).ease('linear')
            .attr('width', width)
        }

        bar.barRect
          .attr('x', barX - (value < 0 ? width : 0));

        if (force || bar.changedValue) {
          bar.barValue
            .text(this._formatter(value) || this.translator('hints/nodata'));
        }
      }

      if (force || bar.changedIndex || presentationModeChanged) {
        bar.self
          .transition().duration(duration).ease('linear')
          .attr('transform', `translate(0, ${this._getBarPosition(bar.index)})`);
      }
    });
  },

  _resizeSvg() {
    const { barHeight, barMargin } = this.activeProfile;
    this.barSvg.attr('height', `${(barHeight + barMargin) * this.sortedEntities.length}px`);
  },

  _scroll(duration = 0) {
    const follow = this.barContainer.select('.vzb-selected');
    if (!follow.empty()) {
      const d = follow.datum();
      const yPos = this._getBarPosition(d.index);

      const { margin } = this.activeProfile;
      const height = this.height - margin.top - margin.bottom;

      const currentTop = this.barViewport.node().scrollTop;
      const currentBottom = currentTop + height;

      const scrollTo = yPos < currentTop ?
        yPos :
        (yPos + this.activeProfile.barHeight > currentBottom) ?
          (yPos - height + this.activeProfile.barHeight) :
          0;

      if (scrollTo) {
        this.barViewport.transition().duration(duration)
          .tween('scrollfor' + d.entity, this._scrollTopTween(scrollTo));
      }
    }
  },

  _createAndDeleteBars(updatedBars) {
    const _this = this;

    // remove groups for entities that are gone
    updatedBars.exit().remove();

    // make the groups for the entities which were not drawn yet (.data.enter() does this)
    updatedBars.enter()
      .append('g')
      .each(function (d) {
        const self = d3.select(this);

        self
          .attr('class', 'vzb-br-bar')
          .classed('vzb-selected', _this.model.marker.isSelected(d))
          .attr('id', `vzb-br-bar-${d.entity}-${_this._id}`)
          .on('mousemove', d => _this.model.marker.highlightMarker(d))
          .on('mouseout', () => _this.model.marker.clearHighlighted())
          .on('click', d => {
            _this.model.marker.selectMarker(d)
          });

        const barRect = self.append('rect')
          .attr('stroke', 'transparent');

        const labelFull = _this.values.label[d.entity];
        const labelSmall = labelFull.length < 12 ? labelFull : `${labelFull.substring(0, 9)}...`;
        const barLabel = self.append('text')
          .attr('class', 'vzb-br-label')
          .attr('dominant-baseline', 'middle');

        const labelFullWidth = barLabel.text(labelFull).node().getBBox().width;
        const labelSmallWidth = barLabel.text(labelSmall).node().getBBox().width;

        const barValue = self.append('text')
          .attr('class', 'vzb-br-value')
          .attr('dominant-baseline', 'middle');

        Object.assign(d, {
          self,
          barRect,
          barLabel,
          barValue,
          isNew: true,
          labelFullWidth,
          labelSmallWidth,
          labelFull,
          labelSmall,
        });
      });
  },

  _getWidestLabelWidth(big = false) {
    const widthKey = big ? 'labelFullWidth' : 'labelSmallWidth';
    const labelKey = big ? 'labelFull' : 'labelSmall';

    const bar = this.sortedEntities
      .reduce((a, b) => {
        return a[widthKey] < b[widthKey] ? b : a;
      });

    const text = bar.barLabel.text();
    const width = bar.barLabel.text(bar[labelKey]).node().getBBox().width;
    bar.barLabel.text(text);

    return width;
  },

  _drawColors() {
    const _this = this;

    this.barContainer.selectAll('.vzb-br-bar>rect')
      .each(function ({ entity }) {
        const self = d3.select(this);
        const color = _this.values.color[entity];

        if (!color && color !== 0) {
          self
            .style('fill', COLOR_WHITEISH)
            .attr('stroke', COLOR_BLACKISH)
        } else {
          self
            .style('fill', _this._getColor(color))
            .attr('stroke', 'transparent');
        }
      });

    this.barContainer.selectAll('.vzb-br-bar>text')
      .style('fill', ({ entity }) => this._getDarkerColor(this.values.color[entity]));
  },

  _getColor(value) {
    return d3.rgb(this.cScale(value));
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

  _selectBars() {
    const entityDim = this.model.entities.dim;
    const selected = this.model.marker.select;

    // unselect all bars
    this.barContainer.classed('vzb-dimmed-selected', false);
    this.barContainer.selectAll('.vzb-br-bar.vzb-selected').classed('vzb-selected', false);

    // select the selected ones
    if (selected.length) {
      this.barContainer.classed('vzb-dimmed-selected', true);
      selected.forEach(selectedBar => {
        this.barContainer
          .select(`#vzb-br-bar-${selectedBar[entityDim]}-${this._id}`)
          .classed('vzb-selected', true);
      });
    }

  },

  _updateOpacity() {
    const { model: { marker } } =  this;

    const OPACITY_HIGHLIGHT_DEFAULT = 1;
    const {
      highlight,
      select,

      opacityHighlightDim: OPACITY_HIGHLIGHT_DIM,
      opacitySelectDim: OPACITY_SELECT_DIM,
      opacityRegular: OPACITY_REGULAR,
    } = marker;

    const [
      someHighlighted,
      someSelected
    ] = [
      highlight.length > 0,
      select.length > 0
    ];

    this.barContainer.selectAll('.vzb-br-bar')
      .style('opacity', d => {
        if (someHighlighted && marker.isHighlighted(d)) {
          return OPACITY_HIGHLIGHT_DEFAULT;
        }

        if (someSelected) {
          return marker.isSelected(d) ? OPACITY_REGULAR : OPACITY_SELECT_DIM;
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
        !this.model.marker.select.length ?
          this.wScale(+this.model.time.value.getUTCFullYear().toString()) :
          1
      )
    );
  },

});

export default BarRankChart;
