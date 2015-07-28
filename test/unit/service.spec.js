/*
 * tests the vizabiFactory, which is supposed to render Vizabi
 */
describe('vizabiFactory', function() {

  "use strict";

  beforeEach(module('gapminderWorld'));

  var vizabiFactory;

  beforeEach(inject(function (_vizabiFactory_) {
    vizabiFactory = _vizabiFactory_;
  }));

  it('should render Vizabi', function() {

    //TODO: test
    expect(1).toEqual(1);

  });

});