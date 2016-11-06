/*!
 * VIZABI GAPMINDER PREFERENCES (included only in Gapminder build)
 */

import globals from 'base/globals';
import * as utils from 'base/utils';
import Promise from 'base/promise';
import * as models from 'models/_index'; //TODO: Fake import because Model is not included first to bundle due to a cyclical dependency.
import Tool from 'base/tool';
import Vzb from 'vizabi';

//import tools
import BubbleChart from 'tools/bubblechart';
import BarRankChart from 'tools/barrankchart';
import MountainChart from 'tools/mountainchart';
import MCComponent from 'tools/mountainchart-component';
import BarChart from 'tools/barchart';
import BubbleMap from 'tools/bubblemap';
import BMComponent from 'tools/bubblemap-component';
import LineChart from 'tools/linechart';
import PopByAge from 'tools/popbyage';
import DonutChart from 'tools/donutchart';
import Cartogram from 'tools/cartogram';
import CartogramComponent from 'tools/cartogram-component';
import AxisLabeler from 'tools/axislabeler';
import AgePyramid from 'tools/agepyramid';
import JOINTPyramidLine from 'tools/joint_pyramidline';
import JOINTCartogramLine from 'tools/joint_cartogramline';


// Fallback in case if WS is not available - requesting data from local files
var locationArray = window.location.href.split("/");
var localUrl = locationArray.splice(0, locationArray.indexOf("preview")).join("/") + "/preview/";

globals.ext_resources = utils.deepExtend({
  host: localUrl,
  preloadPath: 'data/',
  dataPath: 'data/waffles/'
}, globals.ext_resources);


//preloading mountain chart precomputed shapes
MCComponent.define("preload", function(done) {
  var shape_path = globals.ext_resources.shapePath ? globals.ext_resources.shapePath :
      globals.ext_resources.host + globals.ext_resources.preloadPath + "mc_precomputed_shapes.json";     

  d3.json(shape_path, function(error, json) {
    if(error) return console.warn("Failed loading json " + shape_path + ". " + error);
    MCComponent.define('precomputedShapes', json);
    done.resolve();
  });
});

//preloading bubble map country shapes
BMComponent.define("preload", function(done) {
  var shape_path = globals.ext_resources.shapePath ? globals.ext_resources.shapePath :
      globals.ext_resources.host + globals.ext_resources.preloadPath + "world-50m.json"; 
    
  d3.json(shape_path, function(error, json) {
    if(error) return console.warn("Failed loading json " + shape_path + ". " + error);
    BMComponent.define('world', json);
    done.resolve();
  });
});

CartogramComponent.define("preload", function(done) {
  var shape_path = globals.ext_resources.shapePath ? globals.ext_resources.shapePath :
      globals.ext_resources.host + globals.ext_resources.preloadPath + "municipalities.json"; 
  
  d3.json(shape_path, function(error, json) {
    if(error) return console.warn("Failed loading json " + shape_path + ". " + error);
    CartogramComponent.define('world', json);
    CartogramComponent.define('geometries', json.objects.topo.geometries);
    CartogramComponent.define('id_lookup', json.objects.id_lookup);
    done.resolve();
  });
});

//preloading concept properties for all charts
Tool.define("preload", function(promise) {

  if (!this.model.data || this.model.data.noConceptprops) {
    promise.resolve();
    return;
  }
  
  var reader = this.model.data.getPlainObject();
  reader.parsers = [];
  
  this.model.getDataManager().loadConceptProps(reader, this.model.language.id, function(concepts) {

    promise.resolve();

  });

});

export default Vzb;
