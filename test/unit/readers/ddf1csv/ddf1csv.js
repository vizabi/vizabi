
var ddfcsvReader = require('src/readers/ddf1csv/ddf1csv');
var Ddf = require('src/readers/ddf1csv/ddf');

var lang = 'en';
var filesDataCSV = [];
var filesDataJSON = {};
var filesDataHTML = {};

var regexpFileCSV = /\.data\/ddf.*\.csv$/;
var regexpFileJSON = /\/test\/fixture.*\.json$/;
var regexpFileHTML = /\/test\/fixture.*\.html$/;

for(var fileItem in window.__karma__.files) {
  if(window.__karma__.files.hasOwnProperty(fileItem)) {
    if(regexpFileCSV.test(fileItem)) {
      filesDataCSV.push(fileItem);
    }
    if(regexpFileJSON.test(fileItem)) {
      var fileName = fileItem.split('/').pop();
      filesDataJSON[fileName] = fileItem.replace('/base/', '');
    }
    if(regexpFileHTML.test(fileItem)) {
      var fileName = fileItem.split('/').pop();
      filesDataHTML[fileName] = fileItem;
    }
  }
}

describe('Vizabi Readers, ', function () {

  var defaultReaderParams = {
    'parsers' : {},
    'path': "fake-path",
    'reader': "ddf1-csv",
    'splash': false
  };

  describe('DDF-CSV Reader, Default flow, ', function () {

    var defaultQuery = {
      "select":["geo","time","children_per_woman_total_fertility"],
      "where":{"geo.is--country":true,"time":[["1800","2015"]]},
      "grouping":{},
      "orderBy":"time"
    };

    it("Should create Ddf instance for new ddfcsvReader instance", function (done) {

      var dcReader;

      spyOn(Ddf, 'default');

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      expect(Ddf.default).toHaveBeenCalled();

      done();

    });

    it("Should use getFilesList method of Ddf for new ddfcsvReader instance", function (done) {

      var dcReader;

      spyOn(Ddf.default.prototype, 'getFilesList');

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      expect(Ddf.default.prototype.getFilesList).toHaveBeenCalled();

      done();

    });

    it("Should skip non-CSV files when Ddf read files from provided html page", function (done) {
      var updatedReaderParams,
        dcReader,
        filesFromLength,
        filesReadyLength;

      updatedReaderParams = utils.extend({}, defaultReaderParams);
      updatedReaderParams.path = filesDataHTML['get-files.html'];

      // Fixture provide 5 - csv files and 1 - json file
      filesFromLength = 5;

      dcReader = new ddfcsvReader.default(updatedReaderParams);
      filesReadyLength = dcReader.ddf.filesList.length;

      expect(filesReadyLength).toBe(filesFromLength);

      done();

    });

    it("Should reject read method if files were not found", function (done) {

      var dcReader;

      spyOn(XMLHttpRequest.prototype, 'send').and.callFake(function() {
        return false;
      });

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      dcReader.read(defaultQuery, lang).then(function(){

        fail("ddf-csv Reader, 'read' was resolved");
        done();

      }, function(){

        expect(dcReader.ddf.filesList.length).toEqual(0);
        done();

      });

    });

    it("Should resolve read method if provided file for request have incorrect datapoints", function (done) {
      var data,
        dcReader,
        updatedQuery;

      var filesDataCSVUpdated = filesDataCSV.slice();
      var selectIndex = filesDataCSVUpdated.indexOf('/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--child_mortality_0_5_year_olds_dying_per_1000_born--by--geo--time.csv');
      filesDataCSVUpdated[selectIndex] = '/base/test/fixture/ddf--datapoints--child_mortality_0_5_year_olds_dying_per_1000_born--by--geo--time.csv';

      spyOn(Ddf.default.prototype, 'getFilesList').and.callFake(function () {
        return filesDataCSVUpdated;
      });

      updatedQuery = {
        "select":["geo","time","child_mortality_0_5_year_olds_dying_per_1000_born"],
        "where":{"geo.is--country":true,"time":[["1800","2015"]]},
        "grouping":{},
        "orderBy":"time"
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      dcReader.read(updatedQuery, lang).then(function(){

        data = dcReader.getData();
        expect(data.length).toEqual(0);

        done();

      }, function(){

        fail("ddf-csv Reader, 'read' was rejected");
        done();

      });

    });

    it("Should resolve read method if CSV file for requested query is not exists", function (done) {
      var data,
        dcReader,
        updatedQuery;

      var filesDataCSVUpdated = filesDataCSV.slice();
      var selectIndex = filesDataCSVUpdated.indexOf('/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--child_mortality_0_5_year_olds_dying_per_1000_born--by--geo--time.csv');
      filesDataCSVUpdated[selectIndex] = '/not-existed-path/ddf--datapoints--child_mortality_0_5_year_olds_dying_per_1000_born--by--geo--time.csv';

      spyOn(Ddf.default.prototype, 'getFilesList').and.callFake(function () {
        return filesDataCSVUpdated;
      });

      updatedQuery = {
        "select":["geo","time","child_mortality_0_5_year_olds_dying_per_1000_born"],
        "where":{"geo.is--country":true,"time":[["1800","2015"]]},
        "grouping":{},
        "orderBy":"time"
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      dcReader.read(updatedQuery, lang).then(function(){

        data = dcReader.getData();
        expect(data.length).toEqual(0);

        done();

      }, function(){

        fail("ddf-csv Reader, 'read' was rejected");
        done();

      });

    });

    it("Should found index file by name if it was provided in filelist", function (done) {

      var result,
        dcReader,
        updatedQuery,
        selectIndex,
        filesDataCSVUpdated,
        fileIndexName;

      fileIndexName = '/base/test/fixture/ddf--index.csv';

      filesDataCSVUpdated = filesDataCSV.slice();
      selectIndex = filesDataCSVUpdated.indexOf('/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--concepts.csv');
      filesDataCSVUpdated[selectIndex] = fileIndexName;

      spyOn(Ddf.default.prototype, 'getFilesList').and.callFake(function () {
        return filesDataCSVUpdated;
      });

      updatedQuery = {
        "select":["geo","geo.name","geo.world_4region"],
        "where":{"geo.is--country":true},
        "grouping":{},
        "orderBy":null
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      result = dcReader.ddf.cachedFileExists(fileIndexName);
      expect(result).toBe(false);

      dcReader.read(updatedQuery, lang).then(function(){

        result = dcReader.ddf.cachedFileExists(fileIndexName);
        expect(result).toBe(true);

        done();

      }, function(){

        fail("ddf-csv Reader, 'read' was rejected");
        done();

      });

      done();

    });

    it("Should not call getDataPoints method if query has wrong selector", function (done) {
      var data,
        dcReader,
        updatedQuery;

      spyOn(Ddf.default.prototype, 'getFilesList').and.callFake(function () {
        return filesDataCSV;
      });

      spyOn(Ddf.default.prototype, 'getDataPoints');


      updatedQuery = {
        "select":["wrong selector"],
        "where":{"geo.is--country":true,"time":[["1800","2015"]]},
        "grouping":{},
        "orderBy":"time"
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      dcReader.read(updatedQuery, lang).then(function(){

        expect(Ddf.default.prototype.getDataPoints).not.toHaveBeenCalled();
        done();

      }, function(){

        fail("ddf-csv Reader, 'read' was rejected");
        done();

      });

    });

  });

  describe('DDF-CSV Reader, Check Data by Fixtures, ', function () {

    beforeEach(function() {

      spyOn(Ddf.default.prototype, 'getFilesList').and.callFake(function () {
        return filesDataCSV;
      });

    });

    it("Should filter Data by country for selected geo, geo.name, geo.world_4region ", function (done) {

      var data,
        fixture,
        dcReader,
        fixturePath,
        defaultQuery,
        fixtureIndex;

      defaultQuery = {
        "select":["geo","geo.name","geo.world_4region"],
        "where":{"geo.is--country":true},
        "grouping":{},
        "orderBy":null
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      dcReader.read(defaultQuery, lang).then(function(){

        data = dcReader.getData();

        fixtureIndex = 'select-geo-geo.name-geo.world4region-by-country.json';
        fixturePath = filesDataJSON[fixtureIndex];
        fixture = readJSON(fixturePath);

        expect(data.length).toEqual(fixture.length);
        expect(data).toEqual(fixture);

        done();

      }, function(){

        fail("ddf-csv Reader, 'read' was rejected");
        done();

      });

    });

    it("Should correctly process request for :: Child mortality rate & Child mortality rate", function (done) {

      var data,
        dcReader,
        defaultQuery,
        fixtureRaw,
        fixturePath,
        fixtureReady,
        fixtureIndex;

      defaultQuery = {
        "select":["geo","time","child_mortality_0_5_year_olds_dying_per_1000_born","population_total"],
        "where":{"geo.is--country":true,"time":[["1800","2015"]]},
        "grouping":{},
        "orderBy":"time"
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      dcReader.read(defaultQuery, lang).then(function(){

        data = dcReader.getData();

        fixtureIndex = 'datapoints-child-mortality-rate-vs-child-mortality-rate.json';
        fixturePath = filesDataJSON[fixtureIndex];
        fixtureRaw = readJSON(fixturePath);

        fixtureReady = fixtureRaw.map(function(obj){
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

      var data,
        dcReader,
        defaultQuery,
        fixtureRaw,
        fixturePath,
        fixtureReady,
        fixtureIndex;

      defaultQuery = {
        "select":["geo","time","children_per_woman_total_fertility"],
        "where":{"geo.is--country":true,"time":[["1800","2015"]]},
        "grouping":{},
        "orderBy":"time"
      };

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      dcReader.read(defaultQuery, lang).then(function(){

        data = dcReader.getData();

        fixtureIndex = 'datapoints-child-mortality-rate-vs-babies-per-woman.json';
        fixturePath = filesDataJSON[fixtureIndex];
        fixtureRaw = readJSON(fixturePath);

        fixtureReady = fixtureRaw.map(function(obj){
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

  describe('DDF-CSV Reader, Functionality, ', function () {

    var defaultQuery = {
      "select":["geo","time","children_per_woman_total_fertility"],
      "where":{"geo.is--country":true,"time":[["1800","2015"]]},
      "grouping":{},
      "orderBy":"time"
    };

    beforeEach(function() {
      spyOn(Ddf.default.prototype, 'getFilesList').and.callFake(function () {
        return filesDataCSV;
      });
    });

    it("Should find concept file", function (done) {

      var result,
        dcReader;

      spyOn(Ddf.default.prototype, 'getConceptFileNames').and.callThrough();

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      result = dcReader.ddf.getConceptFileNames();

      expect(result.length).toBe(1);
      expect(result[0]).toBe('/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--concepts.csv');

      done();

    });

    it("Should find Entity File Names", function (done) {

      var result,
        resultMock,
        dcReader;

      spyOn(Ddf.default.prototype, 'getEntityFileNames').and.callThrough();

      resultMock = [
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--country.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--g77_and_oecd_countries.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--geographic_regions.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--geographic_regions_in_4_colors.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--income_groups.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--landlocked.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--main_religion_2008.csv',
        '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--entities--geo--world_4region.csv'
      ];

      dcReader = new ddfcsvReader.default(defaultReaderParams);
      result = dcReader.ddf.getEntityFileNames();

      expect(result.length).toBe(8);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an empty result for getHeaderDescriptor method by provided parameters", function (done) {

      var result,
        resultMock,
        paramSelect,
        paramRecord,
        dcReader;

      spyOn(Ddf.default.prototype, 'getHeaderDescriptor').and.callThrough();

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramSelect = ['geo', 'time', 'children_per_woman_total_fertility'];
      paramRecord = {main_religion_2008: 'muslim', name: 'Muslim', gwid: 'i280', 'is--main_religion_2008': 'TRUE'};
      resultMock = {needed: false, convert: {}};

      result = dcReader.ddf.getHeaderDescriptor(paramSelect, paramRecord);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected result for getHeaderDescriptor method by provided parameters", function (done) {

      var result,
        resultMock,
        paramSelect,
        paramRecord,
        dcReader;

      spyOn(Ddf.default.prototype, 'getHeaderDescriptor').and.callThrough();

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramSelect = ['geo', 'time', 'children_per_woman_total_fertility'];
      paramRecord = {geo: 'africa', 'is--world_4region': 'TRUE', name: 'Africa', name_short: 'Africa', name_long: 'The African continent including Madagascar & other islands', description: 'The entire African continent, Madagascar and some islands make up roughly a quarter of the world\'s total land surface.', latitude: '-14.33333', longitude: '28.5', color: '#00d5e9'};
      resultMock = {needed: true, convert: {geo: 'geo'}};

      result = dcReader.ddf.getHeaderDescriptor(paramSelect, paramRecord);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected positive result for applyFilter method by provided parameters", function (done) {

      var result,
        resultMock,
        dcReader,
        paramRecord,
        paramFilter;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramRecord = {country: 'ala', gwid: 'i258', name: 'Åland', geographic_regions: 'europe_central_asia', income_groups: '', landlocked: 'coastline', g77_and_oecd_countries: 'others', geographic_regions_in_4_colors: 'europe', main_religion_2008: '', gapminder_list: 'Åland', alternative_1: '√Öland', alternative_2: '', alternative_3: '', alternative_4_cdiac: '', pandg: '', god_id: 'AX', alt_5: '', upper_case_name: 'AALAND ISLANDS', code: 'ALA', number: '248.0', arb1: '', arb2: '', arb3: '', arb4: '', arb5: '', arb6: '', 'is--country': 'TRUE', world_4region: 'europe', latitude: '60.25', longitude: '20.0'};
      paramFilter = {'geo.is--country': true};
      resultMock = true;

      result = dcReader.ddf.applyFilter(paramRecord, paramFilter);
      expect(result).toBe(resultMock);

      done();

    });

    it("Should get an expected negative result for applyFilter method by provided parameters", function (done) {

      var result,
        resultMock,
        dcReader,
        paramRecord,
        paramFilter;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramRecord = {main_religion_2008: 'christian', name: 'Christian', gwid: 'i279', 'is--main_religion_2008': 'TRUE'};
      paramFilter = {'geo.is--country': true};
      resultMock = false;

      result = dcReader.ddf.applyFilter(paramRecord, paramFilter);
      expect(result).toBe(resultMock);

      done();

    });

    it("Should get an expected result for getFilterConvertPairs method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramFilter;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramFilter = {'geo.is--country': true};
      resultMock = {geo: 'country'};

      result = dcReader.ddf.getFilterConvertPairs(paramFilter);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected empty array as result for normalizeAndFilter method by provided parameters", function (done) {

      var result,
        resultMock,
        dcReader,
        paramHeader,
        paramContent,
        paramFilter;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramHeader = {needed: true, convert: {name: 'geo.name'}};
      paramContent = [{landlocked: 'landlocked', name: 'Landlocked', gwid: 'i271', 'is--landlocked': 'TRUE'}, {landlocked: 'coastline', name: 'Coastline', gwid: 'i270', 'is--landlocked': 'TRUE'}];
      paramFilter = {'geo.is--country': true};
      resultMock = [];

      result = dcReader.ddf.normalizeAndFilter(paramHeader, paramContent, paramFilter);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected array as result for normalizeAndFilter method by provided parameters", function (done) {

      var result,
        resultMock,
        dcReader,
        paramHeader,
        paramContent,
        paramFilter;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramHeader = {needed: true, convert: {name: 'geo.name', world_4region: 'geo.world_4region'}};
      paramContent = [{country: 'ala', gwid: 'i258', name: 'Åland', geographic_regions: 'europe_central_asia', income_groups: '', landlocked: 'coastline', g77_and_oecd_countries: 'others', geographic_regions_in_4_colors: 'europe', main_religion_2008: '', gapminder_list: 'Åland', alternative_1: '√Öland', alternative_2: '', alternative_3: '', alternative_4_cdiac: '', pandg: '', god_id: 'AX', alt_5: '', upper_case_name: 'AALAND ISLANDS', code: 'ALA', number: '248.0', arb1: '', arb2: '', arb3: '', arb4: '', arb5: '', arb6: '', 'is--country': 'TRUE', world_4region: 'europe', latitude: '60.25', longitude: '20.0'}];
      paramFilter = {'geo.is--country': true};
      resultMock = [{'geo': 'ala', 'geo.name': 'Åland', 'geo.world_4region': 'europe'}];

      result = dcReader.ddf.normalizeAndFilter(paramHeader, paramContent, paramFilter);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected array without measures as result for divideByQuery method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramQuery = {select: ['geo', 'geo.name', 'geo.world_4region'], where: {'geo.is--country': true}, grouping: {}, orderBy: null};
      resultMock = {measures: [], other: ['geo', 'geo.name', 'geo.world_4region']};

      result = dcReader.ddf.divideByQuery(paramQuery);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected array with measures as result for divideByQuery method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true}, grouping: {}, orderBy: 'time'};
      resultMock = {measures: ['children_per_woman_total_fertility'], other: ['geo', 'time']};

      result = dcReader.ddf.divideByQuery(paramQuery);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected array as result for getDataPointDescriptorsByIndex method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true, grouping: {}, orderBy: 'time'}};
      resultMock = {descriptors: [], fileNames: []};

      result = dcReader.ddf.getDataPointDescriptorsByIndex(paramQuery);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected empty array as result for getDataPointDescriptorsByFilesList method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true}, grouping: {}, orderBy: 'time'};
      resultMock = [];

      result = dcReader.ddf.getDataPointDescriptorsByFilesList(paramQuery);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected array as result for getDataPointDescriptorsByFilesList method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      dcReader.read(defaultQuery, lang).then(function(){

        paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true}, grouping: {}, orderBy: 'time'};
        resultMock = [{fileName: '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--children_per_woman_total_fertility--by--geo--time.csv', measures:['children_per_woman_total_fertility'], measure:'children_per_woman_total_fertility', other:['geo', 'time']}];

        result = dcReader.ddf.getDataPointDescriptorsByFilesList(paramQuery);
        expect(result).toEqual(resultMock);

        done();

      }, function(){

        fail("ddf-csv Reader, 'read' was rejected");
        done();

      });

    });

    it("Should get an expected array as result for getDataPointDescriptors method by provided parameter", function (done) {

      var result,
        resultMock,
        dcReader,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramQuery = {select: ['geo', 'time', 'children_per_woman_total_fertility'], where: {'geo.is--country': true}, grouping: {}, orderBy: 'time'};
      resultMock = [{fileName: '/base/.data/ddf/ddf--gapminder_world/output/ddf/ddf--datapoints--children_per_woman_total_fertility--by--geo--time.csv', measures: ['children_per_woman_total_fertility'], measure: 'children_per_woman_total_fertility', other: ['geo', 'time']}];

      result = dcReader.ddf.getDataPointDescriptors(paramQuery);
      expect(result).toEqual(resultMock);

      done();

    });

    it("Should get an expected array as result for getDataPoints method by provided parameter", function (done) {

      var dcReader,
        resultMock,
        paramQuery;

      dcReader = new ddfcsvReader.default(defaultReaderParams);

      paramQuery = {
        select: ['geo', 'time', 'tsunami_deaths_annual_number'],
        where: {'geo.is--country': true, "time":[["1800","2015"]]},
        grouping: {},
        orderBy: 'time'
      };

      resultMock = [
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

      dcReader.ddf.getDataPoints(paramQuery, function(result){

        expect(result).toEqual(resultMock);
        done();

      });

    });

  });

});
