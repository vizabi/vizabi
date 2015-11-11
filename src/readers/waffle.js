import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';

/*!
 * Waffle server Reader
 * the simplest reader possible
 */

var WSReader = Reader.extend({

    basepath: "",

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    init: function (reader_info) {
      this._name = 'waffle';
      this._data = [];
      this._formatters = reader_info.formatters;
      this._basepath = reader_info.path || this.basepath;
      if (!this._basepath) {
        utils.error("Missing base path for waffle reader");
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
      var formatted;

      this._data = [];

      (function (query, p) {

/* probably legacy   
        var where = query.where;


        //format time query if existing
        if (where['time']) {
          //[['1990', '2012']] -> '1990-2012'
          where['time'] = where['time'][0].join('-');
        }

        //rename geo.category to geo.cat
        if (where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          where['geo.category'] = void 0;
        }
*/

        var pars = {
          query: query,
          lang: language
        };

        //request data
        utils.post(_this._basepath, JSON.stringify(pars), function (res) {

          // format the response (e.g. create Date objects, parseFloats etc)
          // res = format(res); 
          res = utils.mapRows(res, _this._formatters);


          // validate and resolve
          validate(res);
          p.resolve();

        }, function () {

          console.log("Error loading from Waffle Server:", _this._basepath);
          p.reject('Could not read from waffle server');

        }, true);

        function format(res) {
          //make category an array and fix missing regions
/* gapminder specific
          res = res.map(function (row) {
            row['geo.cat'] = [row['geo.cat']];
            row['geo.region'] = row['geo.region'] || row['geo'];
            return row;
          });
*/

          //format data
          res = utils.mapRows(res, _this._formatters);

/* ORDER BY should be done on waffle server
          //TODO: fix this hack with appropriate ORDER BY
          //order by formatted
          //sort records by time
          var keys = Object.keys(_this._formatters);
          var order_by = keys[0];
          res.sort(function (a, b) {
            return a[order_by] - b[order_by];
          });
          //end of hack
*/
          return res;
        }

        function validate(res) {
          //just check for length, no need to parse from server
          if(res.length==0) {
            p.reject("data reader returns empty array, that's bad");
            return;
          }
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
    }
  });

export default WSReader;
