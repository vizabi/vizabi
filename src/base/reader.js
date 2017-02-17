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

  CONDITION_CALLBACKS: {
    $gt: (configValue, rowValue) => rowValue > configValue,
    $gte: (configValue, rowValue) => rowValue >= configValue,
    $lt: (configValue, rowValue) => rowValue < configValue,
    $lte: (configValue, rowValue) => rowValue <= configValue,
    $in: (configValue, rowValue) => configValue.includes(rowValue)
  },

  ERRORS: {
    GENERIC_ERROR: "reader/error/generic"
  },

  _name: "reader",

  load() {
    return Promise.resolve({
      data: [],
      columns: []
    });
  },

  read(query, parsers = {}) {
    query = this._normalizeQuery(query, parsers);

    const {
      select,
      from,
      order_by = []
    } = query;

    const [orderBy] = order_by;

    return this.load()
      .then(result => {
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
      .catch(error => {
        throw ({}).toString.call(error) === "[object Error]" ?
          this.error(this.ERRORS.GENERIC_ERROR, error) :
          error;
      });
  },

  ensureDataIsCorrect() {

  },

  _normalizeQuery(_query, parsers) {
    const query = Object.assign({}, _query);
    const { where, join } = query;

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

                whereResult[joinRowKey] = parser ?
                  typeof value === "object" ?
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

  _getConcepts(columns, data) {
    return columns.map((concept, index) => {
      const result = { concept };

      if (index < this.keySize) {
        result.concept_type = "entity_domain";
      } else if (index === this.keySize) {
        //the column after is expected to have time
        result.concept_type = "time";
      } else {
        result.concept_type = "measure";

        for (let i = data.length - 1; i >= 0; i--) {
          if (utils.isString(data[i][concept]) && data[i][concept] !== "") {
            result.concept_type = "entity_set";
            [result.domain] = columns;
            break;
          }
        }
      }

      return result;
    });
  },

  _isDataQuery(from) {
    return [
      this.QUERY_FROM_DATAPOINTS,
      this.QUERY_FROM_ENTITIES
    ].includes(from);
  },

  _getRowMapper(query, parsers) {
    const { select } = query;

    return row => {
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
            resultValue = !isNaN(numeric) && isFinite(numeric) ? parseFloat(value.replace(",", ".")) : value;
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
          || (typeof condition !== "object" ?
            (rowValue === condition
              //resolve booleans via strings
              || condition === true && utils.isString(rowValue) && rowValue.toLowerCase().trim() === "true"
              || condition === false && utils.isString(rowValue) && rowValue.toLowerCase().trim() === "false"
            ) :
            Object.keys(condition).every(callbackKey =>
              this.CONDITION_CALLBACKS[callbackKey](condition[callbackKey], rowValue)
            ));
      });
  },

  error(code, message, payload) {
    return {
      code,
      message,
      payload
    };
  }

});

export default Reader;
