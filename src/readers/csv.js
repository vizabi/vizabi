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
    this._formatters = reader_info.formatters;
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
    var path = this._basepath.replace("{{LANGUAGE}}", language);

    //hack: for time and age
    if(!query.where.time && !query.where.age) {
      path = path.replace(".csv", "-properties.csv");
    }
    //if only one year, files ending in "-YYYY.csv"
    else if(query.where.time && query.where.time[0].length === 1) {
      path = path.replace(".csv", "-" + query.where.time[0][0] + ".csv");
    }

    //replace conditional tags {{<any conditional>}}
    path = path.replace(/{{(.*?)}}/g, function(match, capture) {
      capture = capture.toLowerCase();
      if(utils.isArray(query.where[capture])) {
        return query.where[capture].sort().join('-');
      }
      return query.where[capture];
    });

    _this._data = [];

    (function(query, p) {

      //if cached, retrieve and parse
      if(FILE_CACHED.hasOwnProperty(path)) {
        parse(FILE_CACHED[path]);
      }
      //if requested by another hook, wait for the response
      else if(FILE_REQUESTED.hasOwnProperty(path)) {
        FILE_REQUESTED[path].then(function() {
          parse(FILE_CACHED[path]);
        });
      }
      //if not, request and parse
      else {
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
          res = format(res);

          //cache and resolve
          FILE_CACHED[path] = res;
          FILE_REQUESTED[path].resolve();
          FILE_REQUESTED[path] = void 0;

          parse(res);
        });
        FILE_REQUESTED[path] = new Promise();
      }

      function format(res) {

        //make category an array and fix missing regions
        res = res.map(function(row) {
          if(row['geo.cat']) {
            row['geo.cat'] = [row['geo.cat']];
          }
          if(row['geo.region'] || row['geo']) {
            row['geo.region'] = row['geo.region'] || row['geo'];
          }
          return row;
        });

        //format data
        res = utils.mapRows(res, _this._formatters);

        //TODO: fix this hack with appropriate ORDER BY
        //order by formatted
        //sort records by time
        var keys = Object.keys(_this._formatters);
        var order_by = keys[0];
        //if it has time
        if(res[0][order_by]) {
          res.sort(function(a, b) {
            return a[order_by] - b[order_by];
          });
        }
        //end of hack

        return res;
      }

      function parse(res) {

        var data = res;
        //rename geo.category to geo.cat
        var where = query.where;
        if(where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          where['geo.category'] = void 0;
        }

        //format values in the dataset and filters
        where = utils.mapRows([where], _this._formatters)[0];

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
        data = data.map(function(row) {
          return utils.clone(row, query.select);
        });

        // grouping
        data = _this.groupData(data, query);

        _this._data = data;
        p.resolve();
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

  groupData: function(data, query) {

    // nested object which will be used to find the right group for each datarow. Each leaf will contain a reference to a data-object for aggregration.
    var grouping_map = {}; 

    // temporary: only pop is aggregrated

    var filtered = data.filter(function(val, index) {

      var keep = false;
      var leaf = grouping_map; // start at the base

      // find the grouping-index for each grouping property (i.e. entity)
      var keys = Object.keys(query.grouping);
      var n = keys.length;
      for (var i = 0; i < n; i++) {
        var grouping = query.grouping[keys[i]];
        var entity = keys[i];

        var group_index;

        // only age is grouped together for now
        if (entity == 'age') {

          var group_by = grouping;
          var group_offset = 0;

          var group_nr = Math.floor((val[entity] - group_offset) / group_by); // group number
          var group_start = group_nr * group_by + group_offset; // number at which the group starts
          var group_end = group_start + group_by - 1;

          // if the group falls outside the where filter, make the group smaller
          if (group_start < query.where[entity][0][0])
            group_start = query.where[entity][0][0];
          if (group_end > query.where[entity][0][1]) 
            group_end = query.where[entity][0][1];       

          group_index = group_start+'-'+group_end;
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
              // replace with more generic grouping/aggregrate
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

export default CSVReader;