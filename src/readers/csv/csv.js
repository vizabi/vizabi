import * as utils from 'base/utils';
import Reader from 'base/reader';

const cached = {};

const CSVReader = Reader.extend({

  QUERY_FROM_CONCEPTS: 'concepts',
  QUERY_FROM_DATAPOINTS: 'datapoints',
  QUERY_FROM_ENTITIES: 'entities',
  DATA_QUERIES() {
    return [
      this.QUERY_FROM_DATAPOINTS,
      this.QUERY_FROM_ENTITIES
    ];
  },

  CONDITION_CALLBACKS: {
    $gt: (configValue, rowValue) => rowValue > configValue,
    $gte: (configValue, rowValue) => rowValue >= configValue,
    $lt: (configValue, rowValue) => rowValue < configValue,
    $lte: (configValue, rowValue) => rowValue <= configValue,
    $in: (configValue, rowValue) => configValue.includes(rowValue)
  },

  /**
   * Initializes the reader.
   * @param {Object} readerInfo Information about the reader
   */
  init(readerInfo) {
    this._name = 'csv';
    this._data = [];
    this._basepath = readerInfo.path;

    if (!this._basepath) {
      utils.error('Missing base path for csv reader');
    }
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param parsers
   * @returns {Promise} a promise that will be resolved when data is read
   */
  read(query, parsers = {}) {
    const {
      select,
      from,
      order_by = [],
      parsers = []
    } = query;

    const [orderBy] = order_by;

    return this.load({ parsers })
      .then(data => {
        switch (true) {
          case from === this.QUERY_FROM_CONCEPTS:
            return this._getConcepts(data[0]);

          case this.DATA_QUERIES().includes(from) && select.key.length > 0:
            return data
              .reduce(this._reduceData(query), [])
              .sort((prev, next) => prev[orderBy] - next[orderBy]);

          default:
            return [];
        }
      })
      .then(data => parsers.length ? utils.mapRows(data, parsers) : data)
      .catch(utils.warn);
  },

  load(options = {}) {
    const {
      path = this._basepath,
      parsers = {}
    } = options;

    return cached[path] ?
      Promise.resolve(cached[path]) :
      new Promise((resolve, reject) => {
        d3.csv(path)
          .row(row => {
            return Object.keys(row).reduce((result, key) => {
              const value = row[key];
              const parser = parsers[key];

              if (parser) {
                result[key] = parser(value);
              } else {
                const numeric = parseFloat(value);
                result[key] = !isNaN(numeric) && isFinite(numeric) ? numeric : value;
              }

              return result;
            }, {});
          })
          .get((error, result) => {
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

  _getConcepts(firstRow) {
    return Object.keys(firstRow)
      .map(concept => ({ concept }));
  },

  _reduceData(query) {
    const {
      select,
      from
    } = query;

    const [uniqueKey] = select.key;
    const uniqueValues = [];

    return (result, row) => {
      const unique = row[uniqueKey];
      const isUnique = from !== this.QUERY_FROM_ENTITIES || !uniqueValues.includes(unique);
      const isSuitable = this._isSuitableRow(query, row);

      if (isSuitable && isUnique) {
        if (from === this.QUERY_FROM_ENTITIES) {
          uniqueValues.push(unique);
        }

        const rowFilteredByKeys = Object.keys(row)
          .reduce((resultRow, rowKey) => {
            if (select.key.includes(rowKey) || select.value.includes(rowKey)) {
              resultRow[rowKey] = row[rowKey];
            }

            return resultRow;
          }, {});

        result.push(rowFilteredByKeys);
      }

      return result;
    };
  },

  _isSuitableRow(query, row) {
    const { where } = query;

    return !where.$and || where.$and.every(binding =>
        Object.keys(binding).every(conditionKey =>
          this._checkCondition(query, row, binding[conditionKey], conditionKey)
        )
      );
  },

  _checkCondition(query, row, bindingKey, conditionKey) {
    const { join } = query;

    switch (true) {
      case typeof bindingKey === 'string' && bindingKey.startsWith('$'):
        const { where: conditions } = join[bindingKey];

        return Object.keys(conditions).every(rowKey => {
          return this._checkCondition(query, row, conditions[rowKey], rowKey);
        });

      case typeof bindingKey === 'object':
        return this._checkConditionCallbacks(bindingKey, row, conditionKey);

      default:
        return row[conditionKey] === bindingKey;
    }
  },

  _checkConditionCallbacks(conditions, row, rowKey) {
    return Object.keys(conditions).every(conditionKey =>
      this.CONDITION_CALLBACKS[conditionKey](conditions[conditionKey], row[rowKey])
    );
  }

});

export default CSVReader;
