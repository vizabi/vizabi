import CSVReader from "readers/csv/csv";
import { isNumber } from "base/utils";

const CSVTimeInColumnsReader = CSVReader.extend({

  _name: "csv-time_in_columns",

  init(readerInfo) {
    this._super(readerInfo);
    this.timeKey = "time";
  },

  load() {
    return this._super()
      .then(({ rows, columns }) => {
        const indicatorKey = columns[this.keySize];

        const concepts = rows.reduce((result, row) => {
          Object.keys(row).forEach(concept => {
            concept = concept === indicatorKey ? row[indicatorKey] : concept;

            if (String(Number(concept)) !== String(concept) && !result.includes(concept)) {
              result.push(concept);
            }
          });

          return result;
        }, []);
        concepts.splice(1, 0, this.timeKey);

        const indicators = concepts.slice(2);
        const [entityDomain] = concepts;
        return {
          columns: concepts,
          rows: rows.reduce((result, row) => {
            const resultRows = result.filter(resultRow => resultRow[entityDomain] === row[entityDomain]);

            if (resultRows.length) {
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
                    result[indicator] = row[indicatorKey] === indicator ? row[key] : null;
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
