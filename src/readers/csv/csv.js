import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';

var FILE_CACHED = {}; //caches files from this reader
var FILE_REQUESTED = {}; //caches files from this reader

var CSVReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  init: function(reader_info) {
    this._name = 'csv';
    this._data = [];
    this._basepath = reader_info.path;
    this._parsers = reader_info.parsers;
    if(!this._basepath) {
      utils.error("Missing base path for csv reader");
    }
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function(query, language) {
    var _this = this;
    var p = new Promise();

    //this specific reader has support for the tag {{LANGUAGE}}
    this.path = this._basepath.replace("{{LANGUAGE}}", language);

    //replace conditional tags {{<any conditional>}}
    this.path = this.path.replace(/{{(.*?)}}/g, function(match, capture) {
      capture = capture.toLowerCase();
      if(utils.isArray(query.where[capture])) {
        return query.where[capture].sort().join('-');
      }
      return query.where[capture];
    });

    //if only one year, files ending in "-YYYY.csv"
    var loadPath = this.path;
    if(query.where.time && query.where.time[0].length === 1) {
      loadPath = loadPath.replace(".csv", "-" + query.where.time[0][0] + ".csv");
    }

    _this._data = [];

    (function(query, p) {

      // load and then read from the cache when loaded
      var loadPromise = _this.load(loadPath, parse);
      loadPromise.then(function() {
        parse(FILE_CACHED[loadPath]);
      })

      function parse(res) {

        var data = res;   

        //rename geo.category to geo.cat
        var where = query.where;
        if(where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          where['geo.category'] = void 0;
        }

        // load (join) any properties if necessary
        var propertiesLoadPromise = _this.loadProperties(data, query);

        // once done, continue parsing
        propertiesLoadPromise.then(function() {

          //make sure conditions don't contain invalid conditions
          var validConditions = [];
          utils.forEach(where, function(v, p) {
            for(var i = 0, s = data.length; i < s; i++) {
              if(data[i].hasOwnProperty(p)) {
                validConditions.push(p);
                return true;
              }
            };
          });

          // only use valid conditions
          where = utils.clone(utils.deepClone(where), validConditions);

          // 
          where = utils.mapRows([where], _this._parsers)[0];

          //filter any rows that match where condition
          data = utils.filterAny(data, where);

          //warn if filtering returns empty array
          if(data.length == 0) {
            p.reject("data reader returns empty array, that's bad");
            return;
          }

          //only selected items get returned
          data = data.map(function(row) {
            return utils.clone(row, query.select);
          });

          // grouping
          data = _this.groupData(data, query);


          // hack: if no year queried, add it, vizabi expects it
          if (typeof data[0].year === 'undefined' && typeof data[0].time === 'undefined') {
            var isDatapointQuery = true;
            utils.forEach(query.select,function(column) {
              // heuristic: if properties are mentioned, it's not a datapoint query
              if (column.indexOf('.') !== -1) {
                isDatapointQuery = false;
              }
            });
            if (isDatapointQuery) {
              utils.forEach(data, function(row) {
                row.year = new Date("2011");
              })
            }
          }

          // hack for Stats SA: if no geo queried, add it, agepyramid expects it even if there's only 1 country.
          // heuristic: check age or age_by_1_year to apply it only to age pyramid
          if (typeof data[0].geo === 'undefined' && (typeof data[0].age !== "undefined" || typeof data[0].age_by_1_year !== "undefined")) {
            var isDatapointQuery = true;
            utils.forEach(query.select,function(column) {
              // heuristic: if properties are mentioned, it's not a datapoint query
              if (column.indexOf('.') !== -1) {
                isDatapointQuery = false;
              }
            });
            if (isDatapointQuery) {
              utils.forEach(data, function(row) {
                row.geo = "zaf";
              })
            }
          }

          // sorting
          // one column, one direction (ascending) for now
          if(query.orderBy && data[0]) {
            if (data[0][query.orderBy]) {
              data.sort(function(a, b) {
                return a[query.orderBy] - b[query.orderBy];
              });
            } else {
              p.reject("Cannot sort by " + query.orderBy + ". Column does not exist in result.");
            }
          }


          _this._data = data;
          p.resolve();

        })


      }

    })(query, p);

    return p;
  },

  /**
   * Gets the data
   * @returns all data
   */
  getData: function() {
    return this._data;
  },


  format: function(res) {

    //make category an array
    res = res.map(function(row) {
      if(row['geo.cat']) {
        row['geo.cat'] = [row['geo.cat']];
      }
      return row;
    });

    //format data
    res = utils.mapRows(res, this._parsers);

    return res;
  },

  load: function(path) {
    var _this = this;

    //if not yet cached or request, start a request
    if(!FILE_CACHED.hasOwnProperty(path) && !FILE_REQUESTED.hasOwnProperty(path)) {
      // load the csv
      d3.csv(path, function(error, res) {

        if(!res) {
          utils.error("No permissions or empty file: " + path, error);
          return;
        }

        if(error) {
          utils.error("Error Happened While Loading CSV File: " + path, error);
          return;
        }

        //fix CSV response
        res = _this.format(res);

        //cache and resolve
        FILE_CACHED[path] = res;
        FILE_REQUESTED[path].resolve();
        // commented this out because the promise needs to stay for future requests, indicating it is already in the cache
        // FILE_REQUESTED[path] = void 0; 

      });
      FILE_REQUESTED[path] = new Promise();
    }    
    // always return a promise, even if it is already in the cache
    return FILE_REQUESTED[path];
  },

  loadProperties: function(data, query) {
      var _this = this;

      // see if there are any properties used in the query and load them
      // At the moment properties are loaded and added to the data-set only when required but for every query. Maybe loading and adding them to the data-set once is better?
      var propertiesPromises = [];
      var propertiesByKey = {};

      // check both select and where for columns that actually refer to properties
      utils.forEach(query.select, function(column) {
        checkForProperty(column);
      });
      utils.forEach(query.where, function(values, column) {
        checkForProperty(column);
      });

      // load properties for each column referring to property in the dataset
        
      // The below process O(n*m*o) but both n and o are typically small: n = number of property-sets, m = size of data-set, o = number of columns in property-set
      // for each requested property-set
      utils.forEach(propertiesByKey, function(properties, key) {
        properties[key] = true; // also retrieve the key-column
        propertiesPromises.push(loadProperties(properties, key));
      });

      return propertiesPromises.length ? Promise.all(propertiesPromises) : new Promise.resolve();


      function checkForProperty(column) {
        var split = column.split('.');
        if (split.length == 2) {
          propertiesByKey[split[0]] = propertiesByKey[split[0]] || [];
          propertiesByKey[split[0]].push(column);
        }
      }

      function loadProperties(queriedProperties, keyColumn) {

        /*
         * Code below is for a path to a file when properties are shared between datasets
         *

        // parse the url of the original csv
        var parser = document.createElement('a');
        parser.href = path;

        // construct the path of the file with properties of the key column
        var newpathname = parser.pathname.substr(0, parser.pathname.lastIndexOf('/') + 1) + key + "-properties.csv";
        var propertiesPath = parser.protocol + '//' + parser.host + newpathname + parser.search + parser.hash;
        */

        // get path of properties that are specific for the current data-set
        var propertiesPath = _this.path.replace(".csv", "-" + keyColumn + "-properties.csv");

        // load the file and return the promise for loading
        var processedPromise = new Promise();
        var loadPromise = _this.load(propertiesPath);
        loadPromise.then(function() {

          var properties = {};

          // load all the properties in a map with the keyColumn-value as keyColumn (e.g. properties['swe']['geo.name'] = 'Sweden')
          // this map is readable in O(1)
          utils.forEach(FILE_CACHED[propertiesPath], function(object) {
            properties[object[keyColumn]] = object;
          }); 

          // go through each row of data
          utils.forEach(data, function(row, index) { // e.g. row = { geo: se, pop: 1000, gdp: 5 }
            // copy each property that was queried to the matching data-row (matching = same keyColumn)
            utils.forEach(queriedProperties, function(property) {
                
                // check if row exists in properties
                if(properties[row[keyColumn]]){
                    row[property] = properties[row[keyColumn]][property];
                }else{
                    // if not, then complain
                    utils.warn(row[keyColumn] + " is missing from GEO-PROPERTIES.CSV");
                }
              
            })
          });
            
          processedPromise.resolve();

        });

        return processedPromise;
      }
  },

  groupData: function(data, query) {

    // nested object which will be used to find the right group for each datarow. Each leaf will contain a reference to a data-object for aggregration.
    var grouping_map = {}; 

    var filtered = data.filter(function(val, index) {

      var keep;
      var leaf = grouping_map; // start at the base

      // find the grouping-index for each grouping property (i.e. entity)
      var keys = Object.keys(query.grouping);
      var n = keys.length;
      for (var i = 0; i < n; i++) {
        var grouping = query.grouping[keys[i]];
        var entity = keys[i];

        var group_index;

        // TO-DO: only age is grouped together for now, should be more generic
        if (entity == 'age' || entity == 'age_by_1_year') {

          var group_by = grouping;
          var group_offset = 0;

          var group_nr = Math.floor((val[entity] - group_offset) / group_by); // group number
          var group_start = group_nr * group_by + group_offset; // number at which the group starts

          // if the group falls outside the where filter, make the group smaller
          if (group_start < query.where[entity][0][0])
            group_start = query.where[entity][0][0];   

          group_index = group_start;
          val[entity] = group_index;
        }

        // if this is not the last grouping property
        if (i < (n-1)) {

          // create if next grouping level doesn't exist yet
          if (!leaf[val[entity]])
            leaf[val[entity]] = {};
          // set leaf to next level to enable recursion
          leaf = leaf[val[entity]];

        } else {

          // if last grouping property: we are at the leaf and can aggegrate

          if (!leaf[val[entity]]) {

            // if the final leaf isn't set yet, start it by letting it refer to the current row in the data. We will keep this row in the data-set.
            leaf[val[entity]] = val;
            keep = true;

          } else {

            // if the final leaf was already set, aggregrate!
            leaf = leaf[val[entity]];
            // if the leaf already had values, apply the aggregrate functions for each property
            utils.forEach(query.select, function(property, key) {
              
              //avoid aggregating keys, such as geo and time, also avoid aggregating properties, such as geo.region
              if(keys.indexOf(property) != -1 || property.indexOf(keys[0]) != -1) return;
              // aggregrate the un-grouped data (now only sum population)
              // leaf[property] = parseFloat(leaf[property]) + parseFloat(val[property]);
              
              //never aggregate strings!
              if(val[property]!=="" && !+val[property] && +val[property]!==0) return;
              leaf[property] = leaf[property] + val[property];
            });  
            keep = false;

          }

        }

      }

      // if this row will function as place for aggregration, keep it, otherwise, discard it through the filter.
      return keep;

    });
  
    return filtered;

  }

});

export default CSVReader;