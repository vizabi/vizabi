define([
    'jquery',
    'base/utils',
    'components/component'
], function($, utils, Component) {

    var BarChart = Component.extend({

    	init: function(parent, options) {
    		this.name = "barchart";
            this.template = "components/barchart/barchart";

            // Same constructor as the superclass
            this._super(parent, options);
        },

        render: function() {
        	var _this = this;
            // Return the defer from the superclass 
            return this._super(function() {

            	//this is where it draws
            	_this.element.append("text").text("test").attr("x","50px").attr("y","50px");

            });
        }

    });

    return BarChart;

});