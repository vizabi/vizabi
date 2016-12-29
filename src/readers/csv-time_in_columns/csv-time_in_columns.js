import CSVReader from 'readers/csv/csv';
import { isNumber } from 'base/utils';

const CSVTimeInColumnsReader = CSVReader.extend({

  _name: 'csv-time_in_columns',

  init(readerInfo) {
    this._super(readerInfo);
  },

  load() {
    return this._super()
      .then((data) => {
        const [firstRow] = data;
        const [indicatorKey] = Object.keys(firstRow)
          .filter((key) => Number(key) != key)
          .slice(this.keySize, this.keySize + 1);

        const concepts = data.reduce((result, row) => {
          Object.keys(row).forEach((concept) => {
            concept = concept === indicatorKey ? row[indicatorKey] : concept;

            if (Number(concept) != concept && !result.includes(concept)) {
              result.push(concept);
            }
          });

          return result;
        }, []).concat('time');

        const indicators = concepts.slice(1, -1);
        const [entityDomain] = concepts;
        return data.reduce((result, row) => {
          Object.keys(row).forEach((key) => {
            if (![entityDomain, indicatorKey].includes(key)) {
              result.push(
                Object.assign({
                    [entityDomain]: row[entityDomain],
                    time: key,
                  }, indicators.reduce((result, indicator) => {
                    result[indicator] = row[indicatorKey] === indicator ? row[key] : null;
                    return result;
                  }, {})
                )
              );
            }
          });

          return result;
        }, []);
      });
  }

});

export default CSVTimeInColumnsReader;
