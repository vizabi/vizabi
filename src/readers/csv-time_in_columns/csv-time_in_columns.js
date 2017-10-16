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
    return this._super()
      .then(({ rows, columns }) => {
        const missedIndicator = parsers[this.timeKey] && !!parsers[this.timeKey](columns[this.keySize]);
        if (missedIndicator) warn("Indicator column is missed.");
        const indicatorKey = missedIndicator ? this.MISSED_INDICATOR_NAME : columns[this.keySize];

        const concepts = columns.slice(0, this.keySize).concat(missedIndicator ? capitalize(this.MISSED_INDICATOR_NAME) : rows.reduce((result, row) => {
          const concept = row[indicatorKey];
          if (!result.includes(concept) && concept) {
            result.push(concept);
          }
          return result;
        }, []));
        concepts.splice(this.keySize, 0, this.timeKey);

        const indicators = concepts.slice(this.keySize + 1);
        const [entityDomain] = concepts;
        return {
          columns: concepts,
          rows: rows.reduce((result, row) => {
            const resultRows = result.filter(resultRow => resultRow[entityDomain] === row[entityDomain]);

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
                if (![entityDomain, indicatorKey].includes(key)) {

                  const domainAndTime = {
                    [entityDomain]: row[entityDomain],
                    [this.timeKey]: key,
                  };

                  const indicatorsObject = indicators.reduce((result, indicator) => {
                    result[indicator] = missedIndicator || row[indicatorKey] === indicator ? row[key] : null;
                    return result;
                  }, {});

                  result.push(Object.assign(domainAndTime, indicatorsObject));
                }
              });
            }

            return result;
          }, [])
        };
      });
  },

  versionInfo: { version: __VERSION, build: __BUILD }

});

export default CSVTimeInColumnsReader;
