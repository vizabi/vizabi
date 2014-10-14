define(['jquery', 'd3'], function($, d3) {

	var util = {
		d3ToJquery : function (selector) {
			return $(selector[0]);		
		},
		jQueryToD3: function (selector) {
			return d3.selectAll(selector.toArray() );
		}
	};


	return util;
	

});