import CSVReader from 'readers/csv/csv';
import { isNumber } from 'base/utils';

const InlineCSVReader = CSVReader.extend({

  init(readerInfo) {
    this.name = 'inlinecsv';
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

        const [which] = concepts;
        return data.reduce((result, row) => {
          Object.keys(row).forEach((key) => {
            if (![which, 'indicator'].includes(key)) {
              result.push({
                time: key,
                [row.indicator]: row[key],
                [which]: row[which]
              });
            }
          });

          return result;
        }, []);
      });
  }

});

export default InlineCSVReader;
