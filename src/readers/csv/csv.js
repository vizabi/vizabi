import * as utils from 'base/utils';
import Reader from 'base/reader';

const cached = {};

const QUERY_FROM_CONCEPTS = 'concepts';
const QUERY_FROM_DATAPOINTS = 'datapoints';
const QUERY_FROM_ENTITIES = 'entities';
const DATA_QUERIES = [QUERY_FROM_DATAPOINTS, QUERY_FROM_ENTITIES];
const CONDITION_CALLBACKS = {
  $gt: (a, b) => b > a,
  $gte: (a, b) => b >= a,
  $lt: (a, b) => b < a,
  $lte: (a, b) => b <= a,
};

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
        key = []
      },
      from,
      order_by = []
    } = query;

    const [orderBy] = order_by;

    return this.load()
      .then(data => {
        switch (true) {
          case from === QUERY_FROM_CONCEPTS:
            this._data = this._getConcepts(data[0]);
            break;

          case DATA_QUERIES.includes(from) && key.length > 0:
            this._data = data
              .reduce(this._reduceData(query), [])
              .sort((prev, next) => prev[orderBy] - next[orderBy]);
            break;

          default:
            this._data = [];
        }

        this._data = this.format(this._data);
      })
      .catch(utils.warn);
  },

  _getConcepts(firstRow) {
    return Object.keys(firstRow)
      .map(concept => ({ concept }));
  },

  _reduceData(query) {
    const {
      select: {
        value,
        key
      },
      from,
      join,
      where: {
        $and
      }
    } = query;

    const [uniqueKey] = key;
    const uniqueValues = [];

    return (result, row) => {
      const isSuitable = $and.every(binding =>
        Object.keys(binding).every(conditionKey => {
          const conditionValue = join[binding[conditionKey]].where[conditionKey];

          return typeof conditionValue === 'object' ?
            Object.keys(conditionValue).every(compareKey =>
              CONDITION_CALLBACKS[compareKey](conditionValue[compareKey], row[conditionKey])
            ) :
          row[conditionKey] === conditionValue;
        })
      );

      if (isSuitable) {
        const rowFilteredByKeys = Object.keys(row)
          .reduce((resultRow, rowKey) => {
            if (key.includes(rowKey) || value.includes(rowKey)) {
              resultRow[rowKey] = row[rowKey];
            }

            return resultRow;
          }, {});
        result.push(rowFilteredByKeys);

        const unique = row[uniqueKey];
        if (
          from === QUERY_FROM_ENTITIES
          && !uniqueValues.includes(unique)
        ) {
          uniqueValues.push(unique);
        }
      }

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

          resolve(cached[path] = result);
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
