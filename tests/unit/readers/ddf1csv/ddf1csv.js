
var ddfcsvReader = require('src/readers/ddf1csv/ddf1csv');
var Ddf = require('src/readers/ddf1csv/ddf');

var lang = 'en';

var filesDataJSON = {};
var regexpFileJSON = /\/tests\/fixture.*\.json$/;

for(var fileItem in window.__karma__.files) {
  if(window.__karma__.files.hasOwnProperty(fileItem)) {
    if(regexpFileJSON.test(fileItem)) {
      var fileName = fileItem.split('/').pop();
      filesDataJSON[fileName] = fileItem.replace('/base/', '');
    }
  }
}

describe('Vizabi Readers', function () {

  describe('DDF-CSV Reader', function () {

    describe('Default flow', function () {

      var defaultReaderParams = {
        'parsers' : {},
        'path': "fake-path",
        'reader': "ddf1-csv",
        'splash': false
      };

      var defaultQuery = {
        "select":["geo","time","children_per_woman_total_fertility"],
        "where":{"geo.is--country":true,"time":[["1800","2015"]]},
        "grouping":{},
        "orderBy":"time"
      };

      it("Should use Ddf instance for new ddfcsvReader instance", function (done) {

        spyOn(Ddf, 'default');

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        expect(Ddf.default).toHaveBeenCalled();

        done();

      });

      it("Should fix path without final slash", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        var resultExpected = 'fake-path/';

        expect(ddfCsvReader.ddf.ddfPath).toBe(resultExpected);
        done();

      });

      it("Should process read method correct if wrong path provided", function (done) {

        spyOn(utils, 'error');

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(defaultQuery).then(function(){

          var data = ddfCsvReader.getData();
          expect(data.length).toBe(0);
          expect(utils.error.calls.count()).toEqual(2);
          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });
      });

      it("Should process read method correct if bad index file provided", function (done) {

        var updatedReaderParams = utils.extend({}, defaultReaderParams);
        updatedReaderParams.path = '/base/tests/fixture/';

        var ddfCsvReader = new ddfcsvReader.default(updatedReaderParams);
        ddfCsvReader.read(defaultQuery).then(function(){

          var data = ddfCsvReader.getData();
          expect(data.length).toBe(0);
          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });
      });

      it("Should cache requested files", function (done) {

        var cachedFile= '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--index.csv';

        var updatedQuery = {
          "select":["geo","geo.name","geo.world_4region"],
          "where":{"geo.is--country":true},
          "grouping":{},
          "orderBy":null
        };

        var updatedReaderParams = utils.extend({}, defaultReaderParams);
        updatedReaderParams.path = '/base/.data/ddf/ddf--gapminder_world/output/ddf/';

        var ddfCsvReader = new ddfcsvReader.default(updatedReaderParams);
        var result = ddfCsvReader.ddf.cachedFileExists(cachedFile);
        expect(result).toBe(false);

        ddfCsvReader.read(updatedQuery, lang).then(function(){

          var resultUpdated = ddfCsvReader.ddf.cachedFileExists(cachedFile);
          expect(resultUpdated).toBe(true);

          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

    });

    describe('Process requests', function () {

      var defaultReaderParams = {
        'parsers' : {},
        'path': "/base/.data/ddf/ddf--gapminder_world/output/ddf/",
        'reader': "ddf1-csv",
        'splash': false
      };

      var defaultQuery = {
        "select":["geo","geo.name","geo.world_4region"],
        "where":{"geo.is--country":true},
        "grouping":{},
        "orderBy":null
      };

      it("Should processed concepts correctly", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(defaultQuery, lang).then(function(){

          var data = ddfCsvReader.getData();
          expect(data.length).not.toBe(0);
          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

      it("Should resolve read method if provided file has incorrect datapoints", function (done) {

        spyOn(Ddf.default.prototype, 'getDataPointDescriptorsByIndex').and.callFake(function () {
          var filename = '/base/tests/fixture/ddf--datapoints--child_mortality_0_5_year_olds_dying_per_1000_born--by--geo--time.csv';
          return {
            descriptors: [{
              fileName: filename,
              measures: ['child_mortality_0_5_year_olds_dying_per_1000_born'],
              measure: 'child_mortality_0_5_year_olds_dying_per_1000_born',
              other: ['geo', 'time']
            }],
            fileNames: [
              filename
            ]
          };
        });

        var updatedQuery = {
          "select":["geo","time","child_mortality_0_5_year_olds_dying_per_1000_born"],
          "where":{"geo.is--country":true,"time":[["1800","2015"]]},
          "grouping":{},
          "orderBy":"time"
        };

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(updatedQuery, lang).then(function(){

          var data = ddfCsvReader.getData();
          expect(data.length).toBe(0);
          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

      it("Should resolve read method if CSV file with Datapoints for requested query is not exists", function (done) {

        spyOn(utils, 'error');
        spyOn(Ddf.default.prototype, 'getDataPointDescriptorsByIndex').and.callFake(function () {
          var filename = '/fake-path/ddf--file-not-exists.csv';
          return {
            descriptors: [{
              fileName: filename,
              measures: ['child_mortality_0_5_year_olds_dying_per_1000_born'],
              measure: 'child_mortality_0_5_year_olds_dying_per_1000_born',
              other: ['geo', 'time']
            }],
            fileNames: [
              filename
            ]
          };
        });

        var updatedQuery = {
          "select":["geo","time","child_mortality_0_5_year_olds_more_years_version_7"],
          "where":{"geo.is--country":true,"time":[["1800","2015"]]},
          "grouping":{},
          "orderBy":"time"
        };

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(updatedQuery, lang).then(function(){

          var data = ddfCsvReader.getData();
          expect(data.length).toBe(0);
          expect(utils.error.calls.count()).toEqual(2);
          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

      it("Should not call getDataPoints method if query has wrong selector", function (done) {

        spyOn(Ddf.default.prototype, 'getDataPoints');

        var updatedQuery = {
          "select":["wrong selector"],
          "where":{"geo.is--country":true,"time":[["1800","2015"]]},
          "grouping":{},
          "orderBy":"time"
        };

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(updatedQuery, lang).then(function(){

          expect(Ddf.default.prototype.getDataPoints).not.toHaveBeenCalled();
          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

    });

    describe('Check Data by Fixtures', function () {

      var defaultReaderParams = {
        'parsers' : {},
        'path': "/base/.data/ddf/ddf--gapminder_world/output/ddf/",
        'reader': "ddf1-csv",
        'splash': false
      };

      it("Should filter Data by country for selected geo, geo.name, geo.world_4region ", function (done) {

        var defaultQuery = {
          "select":["geo","geo.name","geo.world_4region"],
          "where":{"geo.is--country":true},
          "grouping":{},
          "orderBy":null
        };

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(defaultQuery, lang).then(function(){

          var data = ddfCsvReader.getData();

          var fixtureIndex = 'select-geo-geo.name-geo.world4region-by-country.json';
          var fixturePath = filesDataJSON[fixtureIndex];
          var fixture = readJSON(fixturePath);

          expect(data.length).toEqual(fixture.length);
          expect(data).toEqual(fixture);

          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

      it("Should correctly process request for :: Child mortality rate & Child mortality rate", function (done) {

        var defaultQuery = {
          "select":["geo","time","child_mortality_0_5_year_olds_dying_per_1000_born","population_total"],
          "where":{"geo.is--country":true,"time":[["1800","2015"]]},
          "grouping":{},
          "orderBy":"time"
        };

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(defaultQuery, lang).then(function(){

          var data = ddfCsvReader.getData();

          var fixtureIndex = 'datapoints-child-mortality-rate-vs-child-mortality-rate.json';
          var fixturePath = filesDataJSON[fixtureIndex];
          var fixtureRaw = readJSON(fixturePath);

          var fixtureReady = fixtureRaw.map(function(obj){
            obj['time'] = new Date(obj['time']);
            return obj;
          });

          expect(data.length).toEqual(fixtureReady.length);
          expect(data).toEqual(fixtureReady);

          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

      it("Should correctly process request for :: Child mortality rate & Babies per woman", function (done) {

        var defaultQuery = {
          "select":["geo","time","children_per_woman_total_fertility"],
          "where":{"geo.is--country":true,"time":[["1800","2015"]]},
          "grouping":{},
          "orderBy":"time"
        };

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        ddfCsvReader.read(defaultQuery, lang).then(function(){

          var data = ddfCsvReader.getData();

          var fixtureIndex = 'datapoints-child-mortality-rate-vs-babies-per-woman.json';
          var fixturePath = filesDataJSON[fixtureIndex];
          var fixtureRaw = readJSON(fixturePath);

          var fixtureReady = fixtureRaw.map(function(obj){
            obj['time'] = new Date(obj['time']);
            return obj;
          });

          expect(data.length).toEqual(fixtureReady.length);
          expect(data).toEqual(fixtureReady);

          done();

        }, function(){

          fail("ddf-csv Reader, 'read' was rejected");
          done();

        });

      });

    });

    describe('Methods', function () {

      var defaultReaderParams = {
        'parsers' : {},
        'path': "/base/.data/ddf/ddf--gapminder_world/output/ddf/",
        'reader': "ddf1-csv",
        'splash': false
      };

      it("Should find concept file", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        var result = ddfCsvReader.ddf.getConceptFileNames();

        expect(result.length).toBe(1);
        expect(result[0].indexOf('ddf--concepts.csv') !== -1).toBe(true);

        done();

      });

      it("Should find Entity File Names", function (done) {

        var defaultQuery = {
          "select":["geo","time","children_per_woman_total_fertility"],
          "where":{"geo.is--country":true,"time":[["1800","2015"]]},
          "grouping":{},
          "orderBy":"time"
        };

        var resultMock = [
          '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--country.csv'
        ];

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);
        var result = ddfCsvReader.ddf.getEntityFileNames(defaultQuery);

        expect(result.length).toBe(resultMock.length);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an empty result for getHeaderDescriptor method by provided parameters", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramSelect = ['geo', 'time', 'children_per_woman_total_fertility'];
        var paramRecord = {main_religion_2008: 'muslim', name: 'Muslim', gwid: 'i280', 'is--main_religion_2008': 'TRUE'};
        var resultMock = {needed: false, convert: {latitude: 'geo.latitude', longitude: 'geo.longitude'}};

        var result = ddfCsvReader.ddf.getHeaderDescriptor(paramSelect, paramRecord);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected result for getHeaderDescriptor method by provided parameters", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramSelect = ['geo', 'time', 'children_per_woman_total_fertility'];
        var paramRecord = {geo: 'africa', 'is--world_4region': 'TRUE', name: 'Africa', name_short: 'Africa', name_long: 'The African continent including Madagascar & other islands', description: 'The entire African continent, Madagascar and some islands make up roughly a quarter of the world\'s total land surface.', latitude: '-14.33333', longitude: '28.5', color: '#00d5e9'};
        var resultMock = {needed: true, convert: {geo: 'geo', latitude: 'geo.latitude', longitude: 'geo.longitude'}};

        var result = ddfCsvReader.ddf.getHeaderDescriptor(paramSelect, paramRecord);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected positive result for applyFilter method by provided parameters", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramRecord = {country: 'ala', gwid: 'i258', name: 'Åland', geographic_regions: 'europe_central_asia', income_groups: '', landlocked: 'coastline', g77_and_oecd_countries: 'others', geographic_regions_in_4_colors: 'europe', main_religion_2008: '', gapminder_list: 'Åland', alternative_1: '√Öland', alternative_2: '', alternative_3: '', alternative_4_cdiac: '', pandg: '', god_id: 'AX', alt_5: '', upper_case_name: 'AALAND ISLANDS', code: 'ALA', number: '248.0', arb1: '', arb2: '', arb3: '', arb4: '', arb5: '', arb6: '', 'is--country': 'TRUE', world_4region: 'europe', latitude: '60.25', longitude: '20.0'};
        var paramFilter = {'geo.is--country': true};
        var resultMock = true;

        var result = ddfCsvReader.ddf.applyFilter(paramRecord, paramFilter);
        expect(result).toBe(resultMock);

        done();

      });

      it("Should get an expected negative result for applyFilter method by provided parameters", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramRecord = {main_religion_2008: 'christian', name: 'Christian', gwid: 'i279', 'is--main_religion_2008': 'TRUE'};
        var paramFilter = {'geo.is--country': true};
        var resultMock = false;

        var result = ddfCsvReader.ddf.applyFilter(paramRecord, paramFilter);
        expect(result).toBe(resultMock);

        done();

      });

      it("Should get an expected result for getFilterConvertPairs method by provided parameter", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramFilter = {'geo.is--country': true};
        var resultMock = {geo: 'country'};

        var result = ddfCsvReader.ddf.getFilterConvertPairs(paramFilter);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected empty array as result for normalizeAndFilter method by provided parameters", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramHeader = {needed: true, convert: {name: 'geo.name'}};
        var paramContent = [{landlocked: 'landlocked', name: 'Landlocked', gwid: 'i271', 'is--landlocked': 'TRUE'}, {landlocked: 'coastline', name: 'Coastline', gwid: 'i270', 'is--landlocked': 'TRUE'}];
        var paramFilter = {'geo.is--country': true};
        var resultMock = [];

        var result = ddfCsvReader.ddf.normalizeAndFilter(paramHeader, paramContent, paramFilter);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected array as result for normalizeAndFilter method by provided parameters", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramHeader = {needed: true, convert: {name: 'geo.name', world_4region: 'geo.world_4region'}};
        var paramContent = [{country: 'ala', gwid: 'i258', name: 'Åland', geographic_regions: 'europe_central_asia', income_groups: '', landlocked: 'coastline', g77_and_oecd_countries: 'others', geographic_regions_in_4_colors: 'europe', main_religion_2008: '', gapminder_list: 'Åland', alternative_1: '√Öland', alternative_2: '', alternative_3: '', alternative_4_cdiac: '', pandg: '', god_id: 'AX', alt_5: '', upper_case_name: 'AALAND ISLANDS', code: 'ALA', number: '248.0', arb1: '', arb2: '', arb3: '', arb4: '', arb5: '', arb6: '', 'is--country': 'TRUE', world_4region: 'europe', latitude: '60.25', longitude: '20.0'}];
        var paramFilter = {'geo.is--country': true};
        var resultMock = [{'geo': 'ala', 'geo.name': 'Åland', 'geo.world_4region': 'europe'}];

        var result = ddfCsvReader.ddf.normalizeAndFilter(paramHeader, paramContent, paramFilter);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected array without measures as result for divideByQuery method by provided parameter", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramQuery = {select: ['geo', 'geo.name', 'geo.world_4region'], where: {'geo.is--country': true}, grouping: {}, orderBy: null};
        var resultMock = {measures: [], other: ['geo', 'geo.name', 'geo.world_4region']};

        var result = ddfCsvReader.ddf.divideByQuery(paramQuery);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected array with measures as result for divideByQuery method by provided parameter", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true}, grouping: {}, orderBy: 'time'};
        var resultMock = {measures: ['children_per_woman_total_fertility'], other: ['geo', 'time']};

        var result = ddfCsvReader.ddf.divideByQuery(paramQuery);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected array as result for getDataPointDescriptorsByIndex method by provided parameter", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true, grouping: {}, orderBy: 'time'}};
        var resultMock = {
          descriptors: [{
            fileName:"/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--children_per_woman_total_fertility--by--geo--time.csv",
            measures:["children_per_woman_total_fertility"],
            measure:"children_per_woman_total_fertility",
            other:["geo","time"]
          }],
          fileNames: [
          '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--children_per_woman_total_fertility--by--geo--time.csv'
        ]};

        var result = ddfCsvReader.ddf.getDataPointDescriptorsByIndex(paramQuery);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected array as result for getDataPointDescriptors method by provided parameter", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true}, grouping: {}, orderBy: 'time'};
        var resultMock = [{
          fileName: '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--children_per_woman_total_fertility--by--geo--time.csv',
          measures: ['children_per_woman_total_fertility'],
          measure: 'children_per_woman_total_fertility',
          other: ['geo', 'time']
        }];

        var result = ddfCsvReader.ddf.getDataPointDescriptors(paramQuery);
        expect(result).toEqual(resultMock);

        done();

      });

      it("Should get an expected array as result for getDataPoints method by provided parameter", function (done) {

        var ddfCsvReader = new ddfcsvReader.default(defaultReaderParams);

        var paramQuery = {
          select: ['geo', 'time', 'tsunami_deaths_annual_number'],
          where: {'geo.is--country': true, "time":[["1800","2015"]]},
          grouping: {},
          orderBy: 'time'
        };

        var resultMock = [
          {geo: 'bgd', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 2},
          {geo: 'fra', time: new Date('Mon Jan 01 1979 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 11},
          {geo: 'ind', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 16390},
          {geo: 'idn', time: new Date('Mon Jan 01 1979 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 539},
          {geo: 'idn', time: new Date('Tue Jan 01 1980 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 0},
          {geo: 'idn', time: new Date('Wed Jan 01 2003 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 0},
          {geo: 'idn', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 165700},
          {geo: 'idn', time: new Date('Sat Jan 01 2005 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 0},
          {geo: 'idn', time: new Date('Sun Jan 01 2006 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 802},
          {geo: 'ken', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 1},
          {geo: 'mys', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 80},
          {geo: 'mdv', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 102},
          {geo: 'mmr', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 71},
          {geo: 'png', time: new Date('Thu Jan 01 1998 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 2182},
          {geo: 'per', time: new Date('Mon Jan 01 1996 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 7},
          {geo: 'syc', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 3},
          {geo: 'slb', time: new Date('Mon Jan 01 2007 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 52},
          {geo: 'som', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 298},
          {geo: 'lka', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 35400},
          {geo: 'tza', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 10},
          {geo: 'tha', time: new Date('Thu Jan 01 2004 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 8345},
          {geo: 'vut', time: new Date('Wed Jan 01 1997 02:00:00 GMT+0200 (EET)'), tsunami_deaths_annual_number: 100}
        ];

        ddfCsvReader.ddf.getDataPoints(paramQuery, function(result){

          expect(result).toEqual(resultMock);
          done();

        });

      });

    });

  });
});
