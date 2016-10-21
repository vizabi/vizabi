import * as utils from 'base/utils';
import Tool from 'base/tool';

import MountainChartComponent from './mountainchart-component';
import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu,
  datawarning,
  datanotes
}
from 'components/_index';

//MOUNTAIN CHART TOOL
var MountainChart = Tool.extend('MountainChart', {

  /**
   * Initializes the tool (MountainChart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "mountainchart";

    //specifying components
    this.components = [{
      component: MountainChartComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.marker", "state.marker_group", "language", "ui"] //pass models to component
    }, {
      component: timeslider,
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time", "state.entities", "state.marker"]
    }, {
      component: dialogs,
      placeholder: '.vzb-tool-dialogs',
      model: ['state', 'ui', 'language']
    }, {
      component: buttonlist,
      placeholder: '.vzb-tool-buttonlist',
      model: ['state', 'ui', 'language']
    }, {
      component: treemenu,
      placeholder: '.vzb-tool-treemenu',
      model: ['state.marker', 'state.marker_tags', 'state.time', 'language']
    }, {
      component: datawarning,
      placeholder: '.vzb-tool-datawarning',
      model: ['language']
    }, {
      component: datanotes,
      placeholder: '.vzb-tool-datanotes',
      model: ['state.marker', 'language']
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  default_model: {
    state: { 
      time: {
        "delay": 100,
        "delayThresholdX2": 50,
        "delayThresholdX4": 25        
      },
      "entities": {
        "opacitySelectDim": 0.3,
        "opacityRegular": 0.7
      }
    },
    language: { },
    ui: {
      chart: {
        manualSortingEnabled: true,
        yMaxMethod: "latest",
        probeX: 1.85,
        xLogStops: [1, 2, 5],
        xPoints: 50
      },
      presentation: false
    }
  },
  
  datawarning_content: {
    title: "Income data has large uncertainty!",
    body: "There are many different ways to estimate and compare income. Different methods are used in different countries and years. Unfortunately no data source exists that would enable comparisons across all countries, not even for one single year. Gapminder has managed to adjust the picture for some differences in the data, but there are still large issues in comparing individual countries. The precise shape of a country should be taken with a large grain of salt.<br/><br/> Gapminder strongly agrees with <a href='https://twitter.com/brankomilan' target='_blank'>Branko Milanovic</a> about the urgent need for a comparable global income survey, especially for the purpose of monitoring the UN poverty-goal.<br/><br/> We are constantly improving our datasets and methods. Please expect revision of this graph within the coming months. <br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
    doubtDomain: [1800, 1950, 2015],
    doubtRange: [1.0, .8, .6]
  }


});

export default MountainChart;