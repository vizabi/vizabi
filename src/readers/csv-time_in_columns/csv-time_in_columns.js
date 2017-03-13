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
      .then(({ data, columns }) => {
        const indicatorKey = columns[this.keySize];

        const concepts = data.reduce((result, row) => {
          Object.keys(row).forEach(concept => {
            concept = concept === indicatorKey ? row[indicatorKey] : concept;

            if (Number(concept) != concept && !result.includes(concept)) {
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
          data: data.reduce((result, row) => {
            const resultRows = result.filter(resultRow => resultRow[entityDomain] === row[entityDomain]);
            if (resultRows.length) {
              resultRows.forEach(resultRow => {
                resultRow[row[indicatorKey]] = row[resultRow[this.timeKey]];
              });
            } else {
              Object.keys(row).forEach(key => {
                if (![entityDomain, indicatorKey].includes(key)) {
                  result.push(
                    Object.assign({
                      [entityDomain]: row[entityDomain],
                      [this.timeKey]: key,
                    }, indicators.reduce((result, indicator) => {
                      result[indicator] = row[indicatorKey] === indicator ? row[key] : null;
                      return result;
                    }, {})
                    )
                  );
                }
              });
            }

            return result;
          }, [])
        };
      });
  }

});

export default CSVTimeInColumnsReader;
