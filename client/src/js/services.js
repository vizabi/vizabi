var d3 = require('d3');
var Vizabi = require('vizabi');
var urlon = require('URLON');

module.exports = function (app) {
  var bases = document.getElementsByTagName('base');
  var baseHref = null;
  if (bases.length > 0) {
    baseHref = bases[0].href;
  }

  function formatDate(date, unit) {
    var timeFormats = {
      "year": d3.time.format("%Y"),
      "month": d3.time.format("%Y-%m"),
      "week": d3.time.format("%Y-W%W"),
      "day": d3.time.format("%Y-%m-%d"),
      "hour": d3.time.format("%Y-%m-%d %H"),
      "minute": d3.time.format("%Y-%m-%d %H:%M"),
      "second": d3.time.format("%Y-%m-%d %H:%M:%S")
    };
    return timeFormats[unit](date);
  }

  function formatDates(state) {
    // Format date objects according to the unit
    if(state && state.time) {
      var unit = state.time.unit || "year";
      if(typeof state.time.value === 'object') {
        state.time.value = formatDate(state.time.value, unit);
      }
      if(typeof state.time.start === 'object') {
        state.time.start = formatDate(state.time.start, unit);
      }
      if(typeof state.time.end === 'object') {
        state.time.end = formatDate(state.time.end, unit);
      }
    }
  }

  app
    .factory("vizabiFactory", [
      function () {
        return {
          /**
           * Render Vizabi
           * @param {String} tool name of the tool
           * @param {DOMElement} placeholder
           * @return {Object}
           */
          render: function (tool, placeholder, options) {
            var loc = window.location.toString();
            var hash = null;
            if (loc.indexOf('#') >= 0) {
              hash = loc.substring(loc.indexOf('#') + 1);
            }

            if (hash) {
              var str = encodeURI(decodeURIComponent(hash));
              var state = urlon.parse(str);
              options.language = {};
              options.language.id = state.id || 'en';
              options.state = state;
            }

            options.bind = options.bind || {};
            options.bind.historyUpdate = onHistoryUpdate;
            function onHistoryUpdate(eventName, state) {
              formatDates(state);
              window.location.hash = urlon.stringify(state);
            }

            return Vizabi(tool, placeholder, options);
          }
        };
      }]);


  app
    .factory("vizabiItems", ['$http', function ($http) {

      return {
        /**
         * Get All Items
         */
        getItems: function () {
          //return the promise directly.
          return $http.get(baseHref + 'api/item')
            .then(function (result) {
              var items = {}, i, s;
              for (i = 0, s = result.data.length; i < s; i++) {
                items[result.data[i].slug] = result.data[i];
              }
              return items;
            });
        }
      };

    }]);

  app
    .factory('menuFactory', [
      '$location', '$q', '$http',
      function ($location, $q, $http) {

        return {
          cached: [],

          /**
           * Get All Items
           */
          getMenu: function () {
            //return the promise directly.
            var _this = this;
            return $http.get(baseHref + 'api/menu')
              .then(function (result) {
                if (result.status === 200) {
                  _this.cached = result.data.children;
                }
                return _this.getCachedMenu();
              });
          },

          /**
           * Returns the home tree data.
           * @returns {}
           */
          getCachedMenu: function () {
            return this.cached;
          },

          /**
           * Returns the current URL.
           * @returns {string}
           */
          getCurrentUrl: function () {
            return $location.$$path;
          }
        };
      }]);
};
