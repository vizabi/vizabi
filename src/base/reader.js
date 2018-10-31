import * as utils from "base/utils";
import Class from "base/class";

/**
 * Initializes the reader.
 * @param {Object} reader_info Information about the reader
 */
const Reader = Class.extend({

  QUERY_FROM_CONCEPTS: "concepts",
  QUERY_FROM_DATAPOINTS: "datapoints",
  QUERY_FROM_ENTITIES: "entities",
  SCHEMA_QUERY_FROM_CONCEPTS: "concepts.schema",
  SCHEMA_QUERY_FROM_DATAPOINTS: "datapoints.schema",
  SCHEMA_QUERY_FROM_ENTITIES: "entities.schema",

  CONDITION_CALLBACKS: {
    $gt: (configValue, rowValue) => rowValue > configValue,
    $gte: (configValue, rowValue) => rowValue >= configValue,
    $lt: (configValue, rowValue) => rowValue < configValue,
    $lte: (configValue, rowValue) => rowValue <= configValue,
    $in: (configValue, rowValue) => configValue.includes(rowValue)
  },

  LOGICAL_TEST: {
    $and: "every",
    $or: "some"
  },

  ERRORS: {
    GENERIC_ERROR: "reader/error/generic"
  },

  _name: "reader",

  load() {
    return Promise.resolve({
      rows: [],
      columns: []
    });
  },

  read(query, parsers = {}) {
    const originalQuery = query;
    query = this._normalizeQuery(query, parsers);

    const {
      select,
      from
    } = query;

    return this.load(parsers)
      .then(result => {
        const { rows, columns } = result;
        this._checkTimeParser(columns, parsers);
        this.ensureDataIsCorrect(result, parsers);

        switch (true) {
          case from === this.SCHEMA_QUERY_FROM_CONCEPTS:
            return [{ key: ["concept"], value: "concept_type" }];

          case from === this.SCHEMA_QUERY_FROM_ENTITIES:
            return columns.slice(0, this.keySize).map(key => ({ key: [key], value: key }));

          case from === this.SCHEMA_QUERY_FROM_DATAPOINTS: {
            const key = columns.slice(0, this.keySize + 1);
            return columns.slice(this.keySize + 1).map(value => ({ key, value }));
          }
          case from === this.QUERY_FROM_CONCEPTS:
            return this._getConcepts(columns, this._mapRows(rows, query, parsers));

          case this._isDataQuery(from) && select.key.length > 0:
            return this._getData(rows, query, parsers);

          default:
            return [];
        }
      })
      .catch(error => {
        this._onLoadError(error);
        if (!utils.find(this.ERRORS, f => f === error.name)) error = this.error(this.ERRORS.GENERIC_ERROR, error);
        if (!error.endpoint) error.endpoint = this._basepath;
        if (!error.ddfql) error.ddfql = originalQuery;
        if (!error.details) error.details = this._name;
        throw error;
      });
  },

  ensureDataIsCorrect() {

  },

  _checkTimeParser(columns, parsers) {
    const timeKey = columns[this.keySize];
    if (!parsers[timeKey]) parsers[timeKey] = t => t;
  },

  _normalizeQuery(_query, parsers) {
    const query = Object.assign({}, _query);
    const { where = {}, join = {} } = query;

    if (where.$and) {
      where.$and = where.$and.reduce((whereResult, condition) => {
        Object.keys(condition).forEach(rowKey => {
          const conditionValue = condition[rowKey];

          if (typeof conditionValue === "string" && conditionValue.startsWith("$")) {
            const joinWhere = join[conditionValue].where;

            Object.keys(joinWhere)
              .forEach(joinRowKey => {
                const value = joinWhere[joinRowKey];
                const parser = parsers[joinRowKey];

                whereResult.push({ [joinRowKey]: parser ?
                  typeof value === "object" ?
                    Object.keys(value).reduce((callbackConditions, callbackKey) => {
                      callbackConditions[callbackKey] = parser(value[callbackKey]);
                      return callbackConditions;
                    }, {}) :
                    parser(value)
                  : value });
              });
          } else {
            const parser = parsers[rowKey];
            whereResult.push({ [rowKey]: parser ? parser(conditionValue) : conditionValue });
          }
        });

        return whereResult;
      }, []);
    }

    return query;
  },

  _getConcepts(columns, rows) {
    return columns.map((concept, index) => {
      const result = { concept };

      if (index < this.keySize) {
        result.concept_type = "entity_domain";
      } else if (index === this.keySize) {
        // the column after is expected to have time
        result.concept_type = "time";
      } else {
        result.concept_type = "measure";

        for (let i = rows.length - 1; i > -1; --i) {
          if (utils.isString(rows[i][concept]) && rows[i][concept] !== "") {
            result.concept_type = "string";
            [result.domain] = columns;
            break;
          }
        }
      }

      return result;
    });
  },

  _getData(rows, query, parsers) {
    const { order_by = [] } = query;
    const [orderBy] = order_by;

    return this._mapRows(rows, query, parsers)
      .reduce(this._applyQuery(query), [])
      .sort((prev, next) => prev[orderBy] - next[orderBy]);
  },

  _isDataQuery(from) {
    return [
      this.QUERY_FROM_DATAPOINTS,
      this.QUERY_FROM_ENTITIES
    ].includes(from);
  },

  _mapRows(rows, query, parsers) {
    return rows.map(this._getRowMapper(query, parsers));
  },

  _getRowMapper(query, parsers) {
    return row => {
      let correct = true;

      const result = Object.keys(row).reduce((result, key) => {
        if (correct) {
          const defaultValue = row[key];
          const defaultValueString = String(defaultValue).trim();

          const parser = parsers[key];
          const resultValue = !utils.isString(defaultValue) ?
            defaultValue :
            parser ?
              parser(defaultValueString) :
              this._parse(defaultValueString);

          if (!resultValue && resultValue !== 0) {
            if (query.select.key.includes(key)) {
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

  _parse(value) {
    return value;
  },

  _applyQuery(query) {
    const {
      select,
      from
    } = query;

    const [uniqueKey] = select.key;
    const uniqueValues = [];

    return (result, row) => {

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
    return !where || Object.keys(where).every(conditionKey => this._testCondition(where[conditionKey], conditionKey, row));
  },

  _testCondition(condition, conditionKey, row) {
    const logicalTest = this.LOGICAL_TEST[conditionKey];
    const rowValue = logicalTest ? conditionKey : row[conditionKey];

    // if the column is missing, then don't apply filter
    return typeof rowValue === "undefined" ||
      (condition instanceof Date ? !(+condition - +rowValue) :
        typeof condition !== "object" ?
          (rowValue === condition
            // resolve booleans via strings
            || condition === true && utils.isString(rowValue) && rowValue.toLowerCase().trim() === "true"
            || condition === false && utils.isString(rowValue) && rowValue.toLowerCase().trim() === "false"
          ) :
          logicalTest ? condition[logicalTest](newCondition => Object.keys(newCondition).every(newConditionKey => this._testCondition(newCondition[newConditionKey], newConditionKey, row))) :
            Object.keys(condition).every(callbackKey =>
              this.CONDITION_CALLBACKS[callbackKey](condition[callbackKey], rowValue, row)
            ));

  },

  _onLoadError(error) {

  },

  error(code, message, payload, query, file) {
    const error = new Error;
    error.name = code;
    error.message = message;
    error.details = payload;
    error.ddfql = query;
    error.endpoint = file;
    return error;
  }

});

export default Reader;
