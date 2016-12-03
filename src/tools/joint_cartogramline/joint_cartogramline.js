/*!
 * VIZABI AGEPYRAMID
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import CartogramComponent from 'tools/cartogram/cartogram-component';
import LCComponent from 'tools/linechart/linechart-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';
import datawarning from 'components/datawarning/datawarning';
import datanotes from 'components/datanotes/datanotes';

//BAR CHART TOOL
var JOINTCartogramLine = Tool.extend('JOINTCartogramLine', {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "joint_cartogramline";

    this.template =
      '<div class="vzb-tool vzb-tool-' + this.name + '">' +
        '<div class="vzb-tool-stage vzb-tool-stage-left" style="position:absolute; left: 0; width: 65%; height: 100%;">' +
          '<div class="vzb-tool-viz vzb-tool-viz-cartogram"></div>' +
        '</div>' +
        '<div class="vzb-tool-stage vzb-tool-stage-right" style="position:absolute; right: 0; top: 0; width: 40%; height: 100%;">' +
          '<div class="vzb-tool-viz vzb-tool-viz-line"></div>' +
          '<div class="vzb-tool-timeslider"></div>' +
        '</div>' +
        '<div class="vzb-tool-sidebar">' +
          '<div class="vzb-tool-dialogs"></div>' +
          '<div class="vzb-tool-buttonlist"></div>' +
        '</div>' +
        '<div class="vzb-tool-datanotes vzb-hidden"></div>' +
        '<div class="vzb-tool-treemenu vzb-hidden"></div>' +
        '<div class="vzb-tool-datawarning vzb-hidden"></div>' +
        '<div class="vzb-tool-labels vzb-hidden"></div>' +
      '</div>';


    //specifying components
    this.components = [{
      component: CartogramComponent,
      placeholder: '.vzb-tool-viz-cartogram',
      model: ["state.time", "state.entities", "state.marker", "locale", "ui"] //pass models to component
    }, {
      component: LCComponent,
      placeholder: '.vzb-tool-viz-line',
      model: ["state.time", "state.entities_line", "state.marker_line", "locale"]
    }, {
      component: timeslider,
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time", "state.entities", "state.marker", "ui"]
    }, {
      component: dialogs,
      placeholder: '.vzb-tool-dialogs',
      model: ['state', 'ui', 'locale']
    }, {
      component: buttonlist,
      placeholder: '.vzb-tool-buttonlist',
      model: ['state', 'ui', 'locale']
    }, {
      component: treemenu,
      placeholder: '.vzb-tool-treemenu',
      model: ['state.marker', 'locale']
    }, {
      component: datawarning,
      placeholder: '.vzb-tool-datawarning',
      model: ['locale']
    }, {
      component: datanotes,
      placeholder: '.vzb-tool-datanotes',
      model: ['state.marker', 'locale']
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  readyOnce: function(){
    this.element = d3.select(this.element);
    //this.element.select(".vzb-ct-axis-y-title").classed("vzb-hidden", true);
    //this.element.select(".vzb-ct-axis-y-info").style("visibility", "hidden");
    this.element.select(".vzb-lc-axis-y-title").classed("vzb-hidden", true);
    this.element.select(".vzb-lc-axis-x-title").classed("vzb-hidden", true);
    this.element.select(".vzb-lc-axis-y-info").classed("vzb-hidden", true);
    this.element.select(".vzb-data-warning").classed("vzb-hidden", true);

  },

  default_model: {
    ui: {
    chart: {
      labels: {
        min_number_of_entities_when_values_hide: 0 //values hide when showing 2 entities or more
      },
      hideXAxisValue: true,
      whenHovering: {
        hideVerticalNow: true,
        showProjectionLineX: true,
        showProjectionLineY: true,
        higlightValueX: true,
        higlightValueY: true,
        showTooltip: false
      },
      stacked: true,
      inpercent: false
    },
    presentation: true
  }

  },

  datawarning_content: {
    title: "",
    body: "Comparing the size of economy across countries and time is not trivial. The methods vary and the prices change. Gapminder has adjusted the picture for many such differences, but still we recommend you take these numbers with a large grain of salt.<br/><br/> Countries on a lower income levels have lower data quality in general, as less resources are available for compiling statistics. Historic estimates of GDP before 1950 are generally also more rough. <br/><br/> Data for child mortality is more reliable than GDP per capita, as the unit of comparison, dead children, is universally comparable across time and place. This is one of the reasons this indicator has become so useful to measure social progress. But the historic estimates of child mortality are still suffering from large uncertainties.<br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
    doubtDomain: [1800, 1950, 2015],
    doubtRange: [1.0, .3, .2]
  }


});

export default JOINTCartogramLine;
