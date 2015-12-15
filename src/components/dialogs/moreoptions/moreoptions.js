import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import {
  simpleslider,
  bubblesize,
  colorlegend,
  indicatorpicker,
  simplecheckbox,
  minmaxinputs
}
from 'components/_index';

/*
 * More options dialog
 */

export default Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'moreoptions';

    this.components = [{
      component: indicatorpicker,
      placeholder: '.vzb-xaxis-selector',
      model: ["state.marker", "language"],
      markerID: "axis_x"
    },{
      component: minmaxinputs,
      placeholder: '.vzb-xaxis-minmax',
      model: ["state.marker", "language"],
      markerID: "axis_x",
      ui: {
        selectMinMax: false,
        selectFakeMinMax: true
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-yaxis-selector',
      model: ["state.marker", "language"],
      markerID: "axis_y"
    }, {
      component: minmaxinputs,
      placeholder: '.vzb-yaxis-minmax',
      model: ["state.marker", "language"],
      markerID: "axis_y",
      ui: {
        selectMinMax: false,
        selectFakeMinMax: true
      }
    }, {
      component: simplecheckbox,
      placeholder: '.vzb-axes-options',
      model: ["state", "language"],
      submodel: 'time',
      checkbox: 'adaptMinMaxZoom'
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-saxis-selector',
      model: ["state.marker", "language"],
      markerID: "size"
    }, {
      component: bubblesize,
      placeholder: '.vzb-dialog-bubblesize',
      model: ["state.marker.size"],
      ui: {
        show_button: false
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-caxis-selector',
      model: ["state.marker", "language"],
      markerID: "color"
    }, {
      component: colorlegend,
      placeholder: '.vzb-clegend-container',
      model: ["state.marker.color", "state.entities", "language"]
    }, {
      component: simpleslider,
      placeholder: '.vzb-dialog-bubbleopacity-regular',
      model: ["state.entities"],
      arg: "opacityRegular"
    }, {
      component: simpleslider,
      placeholder: '.vzb-dialog-bubbleopacity-selectdim',
      model: ["state.entities"],
      arg: "opacitySelectDim"
    }, {
      component: simpleslider,
      placeholder: '.vzb-dialog-delay-slider',
      model: ["state.time"],
      arg: "delay",
      properties: {min:1, max:5, step:0.1, scale: d3.scale.linear()
        .domain([1,2,3,4,5])
        .range([1200,900,450,200,75])
      }
    },
    {
      component: simplecheckbox,
      placeholder: '.vzb-presentationmode-switch',
      model: ["ui", "language"],
      checkbox: 'presentation'
    }];

    this._super(config, parent);
  },

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);
    this.resize();
    
    //accordion
    this.accordionEl = this.element.select('.vzb-accordion');
    if(this.accordionEl) {
      this.accordionEl.selectAll('.vzb-accordion-section')
        .select('.vzb-accordion-section-title')
        .on('click', function() {
          var sectionEl = d3.select(this.parentNode);
          var activeEl = _this.accordionEl.select('.vzb-accordion-active');
          if(activeEl) {
            activeEl.classed('vzb-accordion-active', false);
          }
          if(sectionEl.node() !== activeEl.node()) {
            sectionEl.classed('vzb-accordion-active', true);
          }
        })
    }
  },

  resize: function() {
    var totalHeight = this.root.element.offsetHeight - 200;
    var content = this.element.select('.vzb-dialog-content');
    content.style('max-height', totalHeight + 'px');

    this._super();
  }
});
