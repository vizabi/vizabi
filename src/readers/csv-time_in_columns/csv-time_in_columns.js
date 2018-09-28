import CSVReader from "readers/csv/csv";
import { isNumber, warn, capitalize } from "base/utils";

const CSVTimeInColumnsReader = CSVReader.extend({

  MISSED_INDICATOR_NAME: "indicator",

  _name: "csv-time_in_columns",

  init(readerInfo) {
    this._super(readerInfo);
    this.timeKey = "time";

    Object.assign(this.ERRORS, {
      REPEATED_KEYS: "reader/error/repeatedKeys"
    });
  },

  load(parsers) {
    const { _basepath: path, _lastModified, _name } = this;
    const cachedPromise = this.getCached()[_name + "#" + path + _lastModified];
    const keySize = this.keySize;
    let nameConcept = null;

    return cachedPromise ? cachedPromise : this.getCached()[_name + "#" + path + _lastModified] = this._super()
      .then(({ rows, columns }) => {

        //remove column "name" as array's k+1 th element, but remember its header in a variable. if it's an empty string, call it "name"
        //name column is not at its original index because it was moved by csv reader "load" method
        if (this.hasNameColumn) nameConcept = columns.splice(keySize + 1, 1)[0] || "name";

        const missedIndicator = parsers[this.timeKey] && !!parsers[this.timeKey](columns[keySize]);
        if (missedIndicator) warn("Indicator column is missed.");
        const indicatorKey = missedIndicator ? this.MISSED_INDICATOR_NAME : columns[keySize];

        const concepts = columns.slice(0, keySize)
          .concat(this.timeKey)
          .concat(nameConcept || [])
          .concat(missedIndicator ? capitalize(this.MISSED_INDICATOR_NAME) : rows.reduce((result, row) => {
            const concept = row[indicatorKey];
            if (!result.includes(concept) && concept) {
              result.push(concept);
            }
            return result;
          }, []));

        const indicators = concepts.slice(keySize + 1 + (nameConcept ? 1 : 0));
        const [entityDomain] = concepts;
        return {
          columns: concepts,
          rows: rows.reduce((result, row) => {
            const rowEntityDomain = row[entityDomain];
            const resultRows = result.filter(resultRow => resultRow[entityDomain] === rowEntityDomain);

            if (resultRows.length) {
              if (resultRows[0][row[indicatorKey]] !== null) {
                throw this.error(this.ERRORS.REPEATED_KEYS, undefined, {
                  indicator: row[indicatorKey],
                  key: row[entityDomain]
                });
              }
              resultRows.forEach(resultRow => {
                resultRow[row[indicatorKey]] = row[resultRow[this.timeKey]];
              });
            } else {
              Object.keys(row).forEach(key => {
                if (![entityDomain, indicatorKey, nameConcept].includes(key)) {

                  const domainAndTime = {
                    [entityDomain]: row[entityDomain],
                    [this.timeKey]: key,
                  };

                  const optionalNameColumn = !nameConcept ? {} : {
                    [nameConcept]: row[nameConcept]
                  };

                  const indicatorsObject = indicators.reduce((result, indicator) => {
                    result[indicator] = missedIndicator || row[indicatorKey] === indicator ? row[key] : null;
                    return result;
                  }, {});

                  result.push(Object.assign(domainAndTime, optionalNameColumn, indicatorsObject));
                }
              });
            }

            return result;
          }, [])
        };
      });
  },

  _onLoadError(error) {
    const { _basepath: path, _lastModified, _name } = this;
    delete this.getCached()[_name + "#" + path + _lastModified];

    this._super(error);
  },

  versionInfo: { version: __VERSION, build: __BUILD }

});

export default CSVTimeInColumnsReader;
