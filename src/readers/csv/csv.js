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

  ERRORS: {
    WRONG_TIME_COLUMN_OR_UNITS: 'reader/error/wrongTimeUnitsOrColumn',
    NOT_ENOUGH_ROWS_IN_FILE: 'reader/error/notEnoughRows',
    UNDEFINED_DELIMITER: 'reader/error/undefinedDelimiter',
    EMPTY_HEADERS: 'reader/error/emptyHeaders',
    GENERIC_ERROR: 'reader/error/generic',
  },

  _name: 'csv',

  /**
   * Initializes the reader.
   * @param {Object} readerInfo Information about the reader
   */
  init(readerInfo) {
    this._data = [];
    this._basepath = readerInfo.path;
    this.delimiter = readerInfo.delimiter;
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
    query = this._normalizeQuery(query, parsers);

    const {
      select,
      from,
      order_by = []
    } = query;

    const [orderBy] = order_by;

    return this.load()
      .then((result) => {
        const { data, columns } = result;
        this.ensureDataIsCorrect(result, parsers);

        switch (true) {
          case from === this.QUERY_FROM_CONCEPTS:
            return this._getConcepts(columns, data.map(this._getRowMapper(query, parsers)));

          case this._isDataQuery(from) && select.key.length > 0:
            return data
              .reduce(this._applyQuery(query, parsers), [])
              .sort((prev, next) => prev[orderBy] - next[orderBy]);

          default:
            return [];
        }
      })
      .catch((error) => {
        throw ({}).toString.call(error) === '[object Error]' ?
          this.error(this.ERRORS.GENERIC_ERROR, error) :
          error;
      });
  },

  ensureDataIsCorrect({ columns, data }, parsers) {
    const time = columns[this.keySize];
    const [firstRow] = data;
    const parser = parsers[time];

    if (parser && !parser(firstRow[time])) {
      throw this.error(this.ERRORS.WRONG_TIME_COLUMN_OR_UNITS);
    }

    if (!columns.length) {
      throw this.error(this.ERRORS.EMPTY_HEADERS);
    }
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
      const cachedData = cached[path];

      if (cachedData) {
        resolve(cachedData);
      } else {
        d3.text(path).get((error, text) => {
          if (!text) {
            return reject(`No permissions or empty file: ${path}. ${error}`);
          }

          if (error) {
            return reject(`Error happened while loading csv file: ${path}. ${error}`);
          }

          try {
            const { delimiter = this._guessDelimiter(text) } = this;
            const parser = d3.dsv(delimiter);
            const [header] = this._getRows(text, 1);
            const [columns] = parser.parseRows(header);
            const data = parser.parse(text);

            const result = { columns, data };
            cached[path] = result;
            resolve(result);
          } catch (e) {
            return reject(e);
          }
        });
      }
    });
  },

  _guessDelimiter(text) {
    const stringsToCheck = 2;
    const rows = this._getRows(text, stringsToCheck);

    if (rows.length !== stringsToCheck) {
      throw this.error(this.ERRORS.NOT_ENOUGH_ROWS_IN_FILE);
    }

    const [header, firstRow] = rows;
    const [comma, semicolon] = [',', ';'];
    const commasCountInHeader = this._countCharsInLine(header, comma);
    const semicolonsCountInHeader = this._countCharsInLine(header, semicolon);
    const commasCountInFirstRow = this._countCharsInLine(firstRow, comma);
    const semicolonsCountInFirstRow = this._countCharsInLine(firstRow, semicolon);

    if (
      commasCountInHeader === commasCountInFirstRow
      && commasCountInHeader > 1
      && (
        (semicolonsCountInHeader !== semicolonsCountInFirstRow)
        || (!semicolonsCountInHeader && !semicolonsCountInFirstRow)
        || (commasCountInHeader > semicolonsCountInHeader && commasCountInFirstRow > semicolonsCountInFirstRow)
      )
    ) {
      return comma;
    } else if (
      semicolonsCountInHeader === semicolonsCountInFirstRow
      && semicolonsCountInHeader > 1
      && (
        (commasCountInHeader !== commasCountInFirstRow)
        || (!commasCountInHeader && !commasCountInFirstRow)
        || (semicolonsCountInHeader > commasCountInHeader && semicolonsCountInFirstRow > commasCountInFirstRow)
      )
    ) {
      return semicolon;
    }

    throw this.error(this.ERRORS.UNDEFINED_DELIMITER);
  },

  _getRows(text, count = 0) {
    const re = /([^\r\n]+)/g;
    const rows = [];
    let rowsCount = 0;

    let matches = true;
    while (matches && rowsCount !== count) {
      matches = re.exec(text);
      if (matches && matches.length > 1) {
        ++rowsCount;
        rows.push(matches[1]);
      }
    }

    return rows;
  },

  _countCharsInLine(text, char) {
    const re = new RegExp(char, 'g');
    const matches = text.match(re);
    return matches ? matches.length : 0;
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

  _getRowMapper(query, parsers) {
    const { select } = query;

    return (row) => {
      let correct = true;

      const result = Object.keys(row).reduce((result, key) => {
        if (correct) {
          const value = row[key];
          const parser = parsers[key];
          let resultValue;

          if (parser) {
            resultValue = parser(value);
          } else {
            const numeric = parseFloat(value);
            resultValue = !isNaN(numeric) && isFinite(numeric) ? parseFloat(value.replace(',', '.')) : value;
          }

          if (!resultValue && resultValue !== 0) {
            if (select.key.includes(key)) {
              correct = false;
            }
          } else {
            result[key] = resultValue;
          }
        }

        return result;
      }, {});

      return correct && result;
    };
  },

  _getConcepts(columns, data) {
    return columns.map((concept, index) => {
      const result = { concept };

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
            [result.domain] = columns;
            break;
          }
        }
      }

      return result;
    })
  },

  _applyQuery(query, parsers) {
    const {
      select,
      from
    } = query;

    const [uniqueKey] = select.key;
    const uniqueValues = [];
    const mapRow = this._getRowMapper(query, parsers);

    return (result, row) => {
      row = mapRow(row);

      if (row) {
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
  },

  error(code, message) {
    return { code, message };
  }

});

export default CSVReader;
