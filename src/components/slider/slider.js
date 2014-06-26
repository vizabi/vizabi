//TODO: refactor this whole thing
//TODO: timeslider is composed of jquery button and jquery slider and packed into one, since they can extend 

//TODO: differentiate between chart componenst and others by viz- word

define([
    'jquery',
    'base/utils',
    'components/component',
    'jqueryui_slider'
], function($, utils, Component) {

	var container,
		timeslider,
		handle;

    var Timeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/slider/slider";

            // Same constructor as the superclass
            this._super(parent, options);

            range = this.model.getState("timeRange");
            startYear = this.model.getState("time");
        },

        postRender: function() {
            this.placeholder = utils.d3ToJquery(this.placeholder);
            container = utils.d3ToJquery(this.element);
            //create timeslider
            timeslider = container.find("#slider");
            timeslider.slider();
            handle = timeslider.find(".ui-slider-handle");

            this.update();
        },


        resize: function() {
            this.update();
        },

        update: function() {
           var _this = this,
           	   year = this.model.getState("time");

           timeslider.slider({
           		min: this.model.getState("timeRange")[0],
           		max: this.model.getState("timeRange")[1],
           		value: year,
           		slide: function(evt, ui) {
           			_this.setYear(ui.value);
                _this.events.trigger("timeslider:dragging");
           		}
           });

           handle.attr("data-year", year);
        },

        getYear: function() {
            return this.model.getState("time");
        },

        setYear: function(year, silent) {
            //update state
            this.model.setState({
                time: year
            }, silent);

            this.update();
        },

    });

    return Timeslider;
});