/*!
 * VIZABI GAPMINDER PREFERENCES (included only in Gapminder build)
 */

import 'babel-polyfill';
import globals from 'base/globals';
import * as utils from 'base/utils';
import Tool from 'base/tool';
import Vzb from 'vizabi';
import 'assets/styles/vizabi.scss';
import requireAll from 'helpers/requireAll';

//import tools
import BubbleChart from 'tools/bubblechart/bubblechart';
import BarRankChart from 'tools/barrankchart/barrankchart';
import MountainChart from 'tools/mountainchart/mountainchart';
import BarChart from 'tools/barchart/barchart';
import BubbleMap from 'tools/bubblemap/bubblemap';
import LineChart from 'tools/linechart/linechart';
import DonutChart from 'tools/donutchart/donutchart';
import Cartogram from 'tools/cartogram/cartogram';
import AxisLabeler from 'tools/axislabeler/axislabeler';
import AgePyramid from 'tools/agepyramid/agepyramid';
import JOINTPyramidLine from 'tools/joint_pyramidline/joint_pyramidline';
import JOINTCartogramLine from 'tools/joint_cartogramline/joint_cartogramline';

// Fallback in case if WS is not available - requesting data from local files
var locationArray = window.location.href.split("/");
var localUrl = locationArray.splice(0, locationArray.indexOf("preview")).join("/") + "/preview/";

globals.ext_resources = utils.deepExtend({
  host: localUrl,
  preloadPath: 'data/',
  dataPath: 'data/waffles/'
}, globals.ext_resources);

export default Vzb;
module.exports = Vzb;
