import * as utils from 'base/utils';
import Reader from 'base/reader';

const cached = {};

const QUERY_FROM_CONCEPTS = 'concepts';
const QUERY_FROM_DATAPOINTS = 'datapoints';
const QUERY_FROM_ENTITIES = 'entities';
const DATA_QUERIES = [QUERY_FROM_DATAPOINTS, QUERY_FROM_ENTITIES];

const CSVReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} readerInfo Information about the reader
   */
  init(readerInfo) {
    this._name = 'csv';
    this._data = [];
    this._basepath = readerInfo.path;
    this._parsers = readerInfo.parsers;

    // TODO: remove
    this._parsers.Year = year => new Date(new Date().setYear(year));
    this._parsers['Lines of code'] = lines => +lines;

    if (!this._basepath) {
      utils.error('Missing base path for csv reader');
    }
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @returns a promise that will be resolved when data is read
   */
  read(query) {
    const {
      select: {
        key: keys = []
      },
      from
    } = query;

    return this.load().then(data => {
      if (from === QUERY_FROM_CONCEPTS) {
        this._data = this._getConcepts(data[0]);
      } else if (DATA_QUERIES.includes(from) && keys.length) {
        this._data = data.reduce(this._reduceData(query), []);
      } else {
        this._data = [];
      }
    }).catch(utils.warn);
  },

  _getConcepts(firstRow) {
    return Object.keys(firstRow)
      .map(concept => ({ concept }));
  },

  _reduceData(query) {
    const {
      select: {
        value: values,
        key: keys
      },
      from
    } = query;

    const [key] = query.select.key;
    const uniqueKeys = [];

    return (result, row) => {
      if (from === QUERY_FROM_ENTITIES) {
        const unique = row[key];

        if (uniqueKeys.includes(unique)) {
          return result;
        }

        uniqueKeys.push(unique);
      }

      const rowFilteredByKeys = Object.keys(row)
        .reduce((resultRow, rowKey) => {
          if (keys.includes(rowKey) || values.includes(rowKey)) {
            resultRow[rowKey] = row[rowKey];
          }

          return resultRow;
        }, {});

      result.push(rowFilteredByKeys);

      return result;
    };
  },

  /**
   * Gets the data
   * @returns all data
   */
  getData() {
    return this._data;
  },

  load(path = this._basepath) {
    return cached[path] ?
      Promise.resolve(cached[path]) :
      new Promise((resolve, reject) => {
        d3.csv(path, (error, result) => {
          if (!result) {
            return reject(`No permissions or empty file: ${path}. ${error}`);
          }

          if (error) {
            return reject(`Error happened while loading csv file: ${path}. ${error}`);
          }

          resolve(cached[path] = this.format(result));
        });
      });
  },

  format(data) {
    return data.map(row =>
      Object.keys(row)
        .reduce((result, key) => {
          result[key] = this._parsers[key] ?
            this._parsers[key](row[key]) :
            row[key];

          return result;
        }, {})
    );
  }

});

export default CSVReader;
