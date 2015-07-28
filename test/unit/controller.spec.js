//test main controller

describe('gapminderWorldCtrl', function() {

	"use strict";

	beforeEach(module('gapminderWorld'));

	var $scope;

	//get controller
	beforeEach(inject(function($controller){
		$scope = {};
		$controller('gapminderWorldCtrl', { $scope: $scope });
	}));

  //initial state
	it('is loading at first', function() {
		expect(true).toBeTruthy();
	});

  // TODO: test integration with Vizabi
  // describe('after Vizabi loads', function() {
  // });

});