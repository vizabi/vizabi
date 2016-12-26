import * as utils from 'base/utils';
import Reader from 'base/reader';

const cached = {};

const CSVReader = Reader.extend({

  QUERY_FROM_CONCEPTS: 'concepts',
  QUERY_FROM_DATAPOINTS: 'datapoints',
  QUERY_FROM_ENTITIES: 'entities',

  CONDITION_CALLBACKS: {
    $gt: (configValue, rowValue) => rowValue > configValue,
    $gte: (configValue, rowValue) => rowValue >= configValue,
    $lt: (configValue, rowValue) => rowValue < configValue,
    $lte: (configValue, rowValue) => rowValue <= configValue,
    $in: (configValue, rowValue) => configValue.includes(rowValue)
  },

  _name: 'csv',

  /**
   * Initializes the reader.
   * @param {Object} readerInfo Information about the reader
   */
  init(readerInfo) {
    this._data = [];
    this._basepath = readerInfo.path;
    this.d3reader = readerInfo.delimiter ? d3.dsv(readerInfo.delimiter, 'text/plain') : d3.csv;
    this.keySize = readerInfo.keySize || 1;

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
    query = this._normalizeQuery(utils.deepClone(query), parsers);

    const {
      select,
      from,
      order_by = []
    } = query;

    const [orderBy] = order_by;

    return this.load()
      .then((data) => {
        data = data.map(this._mapRows(parsers));

        switch (true) {
          case from === this.QUERY_FROM_CONCEPTS:
            return this._getConcepts(data);

          case this._isDataQuery(from) && select.key.length > 0:
            return data
              .reduce(this._applyQuery(query), [])
              .sort((prev, next) => prev[orderBy] - next[orderBy]);

          default:
            return [];
        }
      })
      .catch(utils.error);
  },


  /**
   * This function returns info about the dataset
   * in case of CSV reader it's just the name of the file
   * @returns {object} object of info about the dataset
   */
  getDatasetInfo() {
    return { name: this._basepath.split('/').pop() };
  },

  load() {
    const { _basepath: path } = this;

    return new Promise((resolve, reject) => {
      const data = cached[path];

      data ?
        resolve(data) :
        this.d3reader(path)
          .get((error, result) => {
            if (!result) {
              return reject(`No permissions or empty file: ${path}. ${error}`);
            }

            if (error) {
              return reject(`Error happened while loading csv file: ${path}. ${error}`);
            }

            cached[path] = result;
            resolve(result);
          });
    });
  },

  _normalizeQuery(_query, parsers) {
    const query = Object.assign({}, _query);
    const { where, join } = query;

    if (where.$and) {
      where.$and = where.$and.reduce((whereResult, condition) => {
        Object.keys(condition).forEach(rowKey => {
          const conditionValue = condition[rowKey];

          if (typeof conditionValue === 'string' && conditionValue.startsWith('$')) {
            const joinWhere = join[conditionValue].where;

            Object.keys(joinWhere)
              .forEach(joinRowKey => {
                const value = joinWhere[joinRowKey];
                const parser = parsers[joinRowKey];

                whereResult[joinRowKey] = parser ?
                  typeof value === 'object' ?
                    Object.keys(value).reduce((callbackConditions, callbackKey) => {
                      callbackConditions[callbackKey] = parser(value[callbackKey]);
                      return callbackConditions;
                    }, {}) :
                    parser(value)
                  : value;
              });
          } else {
            const parser = parsers[rowKey];
            whereResult[rowKey] = parser ? parser(conditionValue) : conditionValue;
          }
        });

        return whereResult;
      }, {});
    }

    return query;
  },

  _isDataQuery(from) {
    return [
      this.QUERY_FROM_DATAPOINTS,
      this.QUERY_FROM_ENTITIES
    ].includes(from);
  },

  _mapRows(parsers) {
    return row => {
      return Object.keys(row).reduce((result, key) => {
        const value = row[key];
        const parser = parsers[key];

        if (parser) {
          result[key] = parser(value);
        } else {
          const numeric = parseFloat(value);
          result[key] = !isNaN(numeric) && isFinite(numeric) ? parseFloat(value.replace(',', '.')) : value;
        }

        return result;
      }, {});
    };
  },

  _getConcepts(data) {
    const firstRow = data[0];

    return Object.keys(firstRow).map((concept, index) => {
      const result = { concept };
      // TODO: is the order of first/last elements stable?
      // first columns are expected to have keys
      if (index < this.keySize) {
        result.concept_type = 'entity_domain';
      } else if (index === this.keySize) {
        //the column after is expected to have time
        result.concept_type = 'time';
      } else {
        result.concept_type = 'measure';

        for (let i = data.length - 1; i >= 0; i--) {
          if (utils.isString(data[i][concept]) && data[i][concept] !== '') {
            result.concept_type = 'entity_set';
            result.domain = Object.keys(firstRow)[0];
            break;
          }
        }
      }

      return result;
    })
  },

  _applyQuery(query) {
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

    return !where.$and ||
      Object.keys(where.$and).every(conditionKey => {
        const condition = where.$and[conditionKey];
        const rowValue = row[conditionKey];

        // if the column is missing, then don't apply filter
        return rowValue === undefined
          || (typeof condition !== 'object' ?
            (rowValue === condition
              //resolve booleans via strings
              || condition === true && utils.isString(rowValue) && rowValue.toLowerCase().trim() === 'true'
              || condition === false && utils.isString(rowValue) && rowValue.toLowerCase().trim() === 'false'
            ) :
            Object.keys(condition).every(callbackKey =>
              this.CONDITION_CALLBACKS[callbackKey](condition[callbackKey], rowValue)
            ));
      });
  }

});

export default CSVReader;
