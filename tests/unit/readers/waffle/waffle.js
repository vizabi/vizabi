
var waffleReader = require('src/readers/waffle/waffle');

describe('Vizabi Readers', function () {

  describe('Waffle Server Reader', function () {

    var lang = 'en';

    var defaultWsReaderParams = {
      'parsers' : {},
      'path': "fake-path",
      'reader': "waffle",
      'splash': true
    };

    var defaultQuery = {
      'select': [],
      'grouping': {'geo': undefined,'time': undefined},
      'where': {'geo.cat': ['country', 'unstate']}
    };

    var mockResponse = {
      'headers': ['geo.name'],
      'rows': [['afg']]
    };
    var mockResponseBad = {
      'headers': ['geo.name', 'geo.cat'],
      'rows': [['afg', 'country'], ['afg', 'country'], [, 'country']]
    };


    describe('Default flow', function () {

      it("Should use utils.get method for requests", function (done) {

        var wsReader,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(utils, 'get');

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectCheckRequest'];

        wsReader.read(defaultQueryUpdated, lang);
        expect(utils.get).toHaveBeenCalled();

        done();

      });

      it("Should encoded requested query with _encodeQuery method", function (done) {

        var wsReader,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(wsReader, '_encodeQuery');
        spyOn(utils, 'get');

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectEncodedQuery'];

        wsReader.read(defaultQueryUpdated, lang);
        expect(wsReader._encodeQuery.calls.count()).toEqual(1);

        done();

      });

      it("Should parse a response with _parse method", function (done) {

        var wsReader,
          resultMock,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(wsReader, '_parse').and.callThrough();
        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          success(mockResponse);
        });

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectResponseParsed'];
        resultMock = [{'geo.name': 'afg'}];

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          expect(wsReader._parse.calls.count()).toEqual(1);
          expect(wsReader.getData()).toEqual(resultMock);

          done();

        }, function(){

          fail("wsReader, read result was rejected");
          done();

        });

      });

      it("Should processe a response with _uzip method", function (done) {

        var wsReader,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(wsReader, '_uzip').and.callThrough();
        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          success(mockResponse);
        });

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectResponseUziped'];

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          expect(wsReader._uzip.calls.count()).toEqual(1);
          done();

        }, function(){

          fail("wsReader, read result was rejected");
          done();

        });

      });

      it("Should not create instance of waffleReader without mandatory path parameter", function (done) {

        var wsReader,
          errorWithMessage,
          defaultWsReaderParamsUpdated;

        defaultWsReaderParamsUpdated = utils.extend({}, defaultWsReaderParams);
        delete defaultWsReaderParamsUpdated.path;

        spyOn(utils, 'error');

        wsReader = new waffleReader.default(defaultWsReaderParamsUpdated);

        errorWithMessage = utils.error.calls.argsFor(0)[0];
        expect(errorWithMessage).toEqual(wsReader.ERROR_PARAM_PATH);

        done();

      });

    });

    describe('Requests', function () {

      it("Should reject read method with bad request", function (done) {

        var wsReader,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectBadRequest'];

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          fail("wsReader, read result was resolved");
          done();

        }, function(response){

          expect(response.message).toEqual(wsReader.ERROR_NETWORK);
          done();

        });

      });

      it("Should cache the same requests", function (done) {

        var wsReader,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          success(mockResponse);
        });

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectRequestCached'];

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          expect(utils.get.calls.count()).toEqual(1);

          wsReader.read(defaultQueryUpdated, lang).then(function(){

            expect(utils.get.calls.count()).toEqual(1);
            done();

          }, function() {

            fail("wsReader, read result was rejected");
            done();

          });
        }, function(){

          fail("wsReader, read result was rejected");
          done();

        });

      });

      it("Should not cache different requests", function (done) {

        var wsReader,
          defaultQueryUpdatedFirst,
          defaultQueryUpdatedSecond;

        var wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          success(mockResponse);
        });

        defaultQueryUpdatedFirst = utils.extend({}, defaultQuery);
        defaultQueryUpdatedFirst.select = ['newSelectRequestNotCachedFirst'];

        wsReader.read(defaultQueryUpdatedFirst, lang).then(function(){

          defaultQueryUpdatedSecond = utils.extend({}, defaultQuery);
          defaultQueryUpdatedSecond.select = ['newSelectRequestNotCachedSecond'];

          wsReader.read(defaultQueryUpdatedSecond, lang).then(function(){

            expect(utils.get.calls.count()).toEqual(2);
            done();

          }, function() {

            fail("wsReader, read result was rejected");
            done();

          });
        }, function(){

          fail("wsReader, read result was rejected");
          done();

        });

      });

      it("Should cache result Promise for the same queries", function (done) {

        var wsReader,
          defaultQueryUpdated,
          resultFirst,
          resultSecond;

        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          setTimeout(function(){
            success(mockResponse);
          }, 1);
        });

        wsReader = new waffleReader.default(defaultWsReaderParams);

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectForCoverage'];

        resultFirst = wsReader.read(defaultQueryUpdated, lang);
        resultSecond = wsReader.read(defaultQueryUpdated, lang);

        resultFirst.then(function(){

          expect(resultFirst.status).toBe('resolved');
          expect(resultSecond.status).toBe('resolved');

          done();

        }, function(){

          fail("wsReader, read result was reject");
          done();

        });

      });

      it("Should encode query to exact query string", function (done) {

        var wsReader,
          queryString,
          queryStringRaw,
          defaultQueryUpdatedFirst,
          defaultQueryUpdatedSecond;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(utils, 'get');

        defaultQueryUpdatedFirst = utils.extend({}, defaultQuery);
        defaultQueryUpdatedFirst.select = ['newSelectQueryString'];

        wsReader.read(defaultQueryUpdatedFirst, lang);

        queryStringRaw = utils.get.calls.argsFor(0)[0];
        queryString = queryStringRaw.replace(defaultWsReaderParams.path, '');

        expect(queryString).toEqual('?geo.cat=country,unstate&select=newSelectQueryString');

        defaultQueryUpdatedSecond = utils.extend({}, defaultQuery);
        defaultQueryUpdatedSecond.select = ['geo', 'time', 'population'];
        defaultQueryUpdatedSecond.where = {'geo': ['afr', 'chn'], 'time': ['1800', '1950:2000', '2015'], 'geo.cat': ['country', 'region']};

        wsReader.read(defaultQueryUpdatedSecond, lang);

        queryStringRaw = utils.get.calls.argsFor(1)[0];
        queryString = queryStringRaw.replace(defaultWsReaderParams.path, '');

        expect(queryString).toEqual('?geo=afr,chn&time=1800,1950:2000,2015&geo.cat=country,region&select=geo,time,population');

        done();

      });

      it("Should reject read method with appropriative error for bad server response", function (done) {

        var wsReader,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = 'newSelectBadQuery';

        spyOn(utils, 'error');
        spyOn(utils, 'get').and.callFake(function(url, pars, success, error, json) {
          success();
        });

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          fail("wsReader, read result was resolved");
          done();

        }, function(response){

          expect(response.message).toEqual(wsReader.ERROR_RESPONSE);
          expect(utils.get.calls.count()).toEqual(1);
          done();

        });

      });

      it("Should reject read method with appropriative error for bad order value", function (done) {

        var wsReader,
          mockResponseUpdated,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          success(mockResponse);
        });

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = 'geo.name';
        defaultQueryUpdated.orderBy = 'wrongOrdering';

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          fail("wsReader, read result was resolved");
          done();

        }, function(response){

          expect(response.message).toEqual(wsReader.ERROR_ORDERING);
          done();

        });

      });

      it("Should remove * from geo parameter in request", function (done) {

        var wsReader,
          queryString,
          queryStringRaw,
          defaultQueryUpdated;

        spyOn(utils, 'get');

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectForCoverageWithAsteriks'];
        defaultQueryUpdated.where = {'geo': ['*'], 'geo.cat': ['country', 'unstate']};

        wsReader = new waffleReader.default(defaultWsReaderParams);
        wsReader.read(defaultQueryUpdated, lang);

        queryStringRaw = utils.get.calls.argsFor(0)[0];

        queryString = queryStringRaw.replace(defaultWsReaderParams.path, '');
        expect(queryString).toEqual('?geo.cat=country,unstate&select=newSelectForCoverageWithAsteriks');

        done();

      });

      it("Should process bad response correctly", function (done) {

        var wsReader,
          resultMock,
          defaultQueryUpdated;

        wsReader = new waffleReader.default(defaultWsReaderParams);

        spyOn(utils, 'get').and.callFake(function(path, pars, success, error, json) {
          success(mockResponseBad);
        });

        defaultQueryUpdated = utils.extend({}, defaultQuery);
        defaultQueryUpdated.select = ['newSelectResponseBadParsed'];
        resultMock = [{'geo.name': 'afg', 'geo.cat': ['country']}, {'geo.name': 'afg', 'geo.cat': ['country']}, {'geo.name': null, 'geo.cat': ['country']}];

        wsReader.read(defaultQueryUpdated, lang).then(function(){

          expect(wsReader.getData()).toEqual(resultMock);

          done();

        }, function(){

          fail("wsReader, read result was rejected");
          done();

        });

      });

    });

  });
});
