import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';

// caches files from this reader
var FILE_CACHED = {};
// caches files from this reader
var FILE_REQUESTED = {};
// temporal hack for https problem

var GraphReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  init: function (reader_info) {
    this._name = 'graph';
    this._data = [];
    this._basepath = reader_info.path;
    this._formatters = reader_info.formatters;
    if (!this._basepath) {
      utils.error("Missing base path for graph reader");
    }
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function (query, language) {
    var _this = this;
    var p = new Promise();
    // /api/graphs/stats/vizabi-tools?select&time
    var path = this._basepath;
    //format time query if existing
    path += '?select=' + encodeURI(query.select);
    if (query.where.time) {
      var time = query.where.time[0];
      var t = typeof time.join !== 'undefined' && time.length === 2 ?
        // {from: time, to: time}
        JSON.stringify({from: getYear(time[0]), to: getYear(time[1])}) :
        getYear(time[0]);
      path += '&time=' + t;
    }

    function getYear(time) {
      if (typeof time === 'string') {
        return time;
      }

      return time.getFullYear();
    }

    _this._data = [];

    (function (query, p) {
      //if cached, retrieve and parse
      if (FILE_CACHED.hasOwnProperty(path)) {
        parse(FILE_CACHED[path]);
        return p;
      }
      //if requested by another hook, wait for the response
      if (FILE_REQUESTED.hasOwnProperty(path)) {
        FILE_REQUESTED[path].then(function () {
          parse(FILE_CACHED[path]);
        });
        return p;
      }
      //if not, request and parse
      FILE_REQUESTED[path] = new Promise();
      utils.get(path, [], onSuccess, console.error.bind(console), true);
      function onSuccess(resp) {
        if (!resp) {
          utils.error("Empty json: " + path, error);
          return;
        }

        resp = format(uzip(resp.data));
        //cache and resolve
        FILE_CACHED[path] = resp;
        FILE_REQUESTED[path].resolve();
        FILE_REQUESTED[path] = void 0;

        parse(resp);
      }

      return p;

      function uzip(table) {
        var rows = table.rows;
        var headers = table.headers;
        var result = new Array(rows.length);
        // unwrap compact data into json collection
        for (var i = 0; i < rows.length; i++) {
          result[i] = {};
          for (var j = 0; j < headers.length; j++) {
            result[i][headers[j]] = (rows[i][j] || '').toString();
            if (headers[j] === 'geo.cat') {
              result[i][headers[j]] = [result[i][headers[j]]];
            }
          }
        }
        return result;
      }

      function format(res) {
        //format data
        res = utils.mapRows(res, _this._formatters);

        //TODO: fix this hack with appropriate ORDER BY
        //order by formatted
        //sort records by time
        var keys = Object.keys(_this._formatters);
        var order_by = keys[0];
        res.sort(function (a, b) {
          return a[order_by] - b[order_by];
        });
        //end of hack

        return res;
      }

      function parse(res) {

        var data = res;
        //rename geo.category to geo.cat
        var where = query.where;
        if (where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          where['geo.category'] = void 0;
        }

        var geoHardCode = '/api/static/data/geo-properties.csv';

        // load (join) any properties if necessary
        var propertiesLoadPromise = _this.loadProperties(geoHardCode, data, query);

        // once done, continue parsing
        propertiesLoadPromise.then(function() {

          //format values in the dataset and filters
          where = utils.mapRows([where], _this._formatters)[0];

          //make sure conditions don't contain invalid conditions
          var validConditions = [];
          utils.forEach(where, function (v, p) {
            for (var i = 0, s = data.length; i < s; i++) {
              if (data[i].hasOwnProperty(p)) {
                validConditions.push(p);
                return true;
              }
            }
          });
          //only use valid conditions
          where = utils.clone(where, validConditions);

          //filter any rows that match where condition
          data = utils.filterAny(data, where);

          //warn if filtering returns empty array
          if(data.length == 0) {
            p.reject("data reader returns empty array, that's bad");
            return;
          }

          //only selected items get returned
          data = data.map(function (row) {
            return utils.clone(row, query.select);
          });

          // grouping
          data = _this.groupData(data, query);

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
  getData: function () {
    return this._data;
  },

  loadProperties: function (data, query) {
    var _this = this;

    // see if there are any properties used in the query and load them
    // At the moment properties are loaded and added to the data-set only when required but for every query. Maybe loading and adding them to the data-set once is better?
    var propertiesPromises = [];
    var propertiesByKey = {};

    // check both select and where for columns that actually refer to properties
    utils.forEach(query.select, function (column) {
      checkForProperty(column);
    });
    utils.forEach(query.where, function (values, column) {
      checkForProperty(column);
    });

    // load properties for each column referring to property in the dataset

    // The below process O(n*m*o) but both n and o are typically small: n = number of property-sets, m = size of data-set, o = number of columns in property-set
    // for each requested property-set
    utils.forEach(propertiesByKey, function (properties, key) {
      properties[key] = true; // also retrieve the key-column
      propertiesPromises.push(loadProperties(properties, key));
    });

    return propertiesPromises.length ? Promise.all(propertiesPromises) : new Promise.resolve();


    function checkForProperty(column) {
      var split = column.split('.');
      if (split.length === 2) {
        propertiesByKey[split[0]] = propertiesByKey[split[0]] || [];
        propertiesByKey[split[0]].push(column);
      }
    }

    function loadProperties(path, queriedProperties, keyColumn) {

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

      // /api/static/data/geo-properties.csv
      // get path of properties that are specific for the current data-set
      var propertiesPath = path;

      // load the file and return the promise for loading
      var processedPromise = new Promise();
      var loadPromise = _this.load(propertiesPath);
      loadPromise.then(function () {

        var properties = {};

        // load all the properties in a map with the keyColumn-value as keyColumn (e.g. properties['swe']['geo.name'] = 'Sweden')
        // this map is readable in O(1)
        utils.forEach(FILE_CACHED[propertiesPath], function (object) {
          properties[object[keyColumn]] = object;
        });

        // collect missing lines here
        var missingLines = [];

        // go through each row of data
        utils.forEach(data, function (row, index) { // e.g. row = { geo: se, pop: 1000, gdp: 5 }
          // copy each property that was queried to the matching data-row (matching = same keyColumn)
          utils.forEach(queriedProperties, function (property) {

            // check if row exists in properties
            if (properties[row[keyColumn]]) {
              row[property] = properties[row[keyColumn]][property];
            } else {
              // if not, then complain, but only once per unique line
              if (missingLines.indexOf(row["geo"]) == -1) {
                missingLines.push(row["geo"]);
                utils.warn(row["geo"] + "," + row["geo.name"] + ",country," + row["geo.region"] + "," + row["geo.lat"] + "," + row["geo.lng"]);
              }
            }

          })
        });

        if (missingLines.length > 0) utils.warn("the above entries are missing from GEO-PROPERTIES.CSV")

        processedPromise.resolve();

      });

      return processedPromise;
    }
  },

  groupData: function (data, query) {

    // nested object which will be used to find the right group for each datarow. Each leaf will contain a reference to a data-object for aggregration.
    var grouping_map = {};

    var filtered = data.filter(function (val, index) {

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
        if (entity == 'age') {

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
        if (i < (n - 1)) {

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
            utils.forEach(query.select, function (property, key) {
              // TO-DO replace with more generic grouping/aggregrate
              if (property == 'pop') {
                // aggregrate the un-grouped data (now only sum population)
                leaf[property] = parseFloat(leaf[property]) + parseFloat(val['pop']);
              }
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

export default GraphReader;
