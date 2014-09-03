define(['jquery', 'd3'], function($, d3) {

	var util = {
		d3ToJquery : function (selector) {
			return $(selector[0]);		
		},
		jQueryToD3: function (selector) {
			return d3.selectAll(selector.toArray() );
		},
		isSubArray: function (subArray, array) {
	        for (var i = 0 , len = subArray.length; i < len; i++) {
	            if ($.inArray(subArray[i], array) == -1) return false;
	        }
    
        	return true;
    	}
	};


	return util;
	

});