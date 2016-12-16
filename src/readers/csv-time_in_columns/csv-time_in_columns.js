import CSVReader from 'readers/csv/csv';
import { isNumber } from 'base/utils';

const CSVTimeInColumnsReader = CSVReader.extend({

  init(readerInfo) {
    this.name = 'csv-time_in_columns';
    this._super(readerInfo);
  },

  load() {
    return this._super()
      .then((data) => {
        const concepts = data.reduce((result, row) => {
          Object.keys(row).forEach(concept => {
            concept = concept === 'indicator' ? row.indicator : concept;

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
            if (![entityDomain, 'indicator'].includes(key)) {
              result.push(
                Object.assign({
                    [entityDomain]: row[entityDomain],
                    time: key,
                  }, indicators.reduce((result, indicator) => {
                    result[indicator] = row.indicator === indicator ? row[key] : null;
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
