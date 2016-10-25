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

  var _this = this;

  //TODO: concurrent
  //load language first
  this.preloadLanguage().then(function() {
    //then concept properties
    
    if (!_this.model.data || _this.model.data.noConceptprops) {
      promise.resolve();
      return;
    }
    
    var reader = _this.model.data.getPlainObject();
    reader.parsers = [];
    
    _this.model.getDataManager().loadConceptProps(reader, function(concepts) {

      // TODO: REMOVE THIS HACK
      // We are currently saving concept properties info to default state manually in order
      // to produce small URLs considering some of the info in concept properties to be default
      // we need a consistent way to add concept properties to Vizabi
      addPalettes(concepts, "color");

      promise.resolve();

    });
  });

  function addPalettes(concepts, hook) {
    //protection in case if state or marker or [hook] is undefined
    if(!((_this.default_model.state||{}).marker||{})[hook]) return;
    if(!((_this.model.state||{}).marker||{})[hook]) return;
    
    var color = _this.default_model.state.marker[hook];
    //which can come from either default model or an external page
    var which = color.which || _this.model.state.marker.color.which;
    var palette = ((concepts[which]||{}).color||{}).palette||{};
    var paletteLabels = ((concepts[which]||{}).color||{}).paletteLabels||{};
    color.palette = utils.extend({}, color.palette, palette);
    color.paletteLabels = utils.clone(paletteLabels);
  }

});

Tool.define("preloadLanguage", function() {
  var _this = this;
  var promise = new Promise();

  var langModel = this.model.language;
  
  // quit if no language model is set (go translationless)
  if(!langModel) return promise.resolve();
  
  if(globals.ext_resources.translationPath) {
    // if a path to external tranlation file is provided, extend the default strings with the ones from that file
    d3.json(globals.ext_resources.translationPath + langModel.id + ".json", function(receivedStrings) {
      var knownStrings = {};
      if(langModel.strings[langModel.id]) knownStrings = langModel.strings[langModel.id].getPlainObject()
      langModel.strings[langModel.id] = utils.extend(knownStrings, receivedStrings);
      _this.model.language.strings.trigger("change");
      promise.resolve();
    });
  } else {
    promise = promise.resolve();
  }

  return promise;

});

export default Vzb;
