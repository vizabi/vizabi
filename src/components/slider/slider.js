//TODO: refactor this whole thing
//TODO: timeslider is composed of jquery button and jquery slider and packed into one, since they can extend 

//TODO: differentiate between chart componenst and others by viz- word

define([
    'jquery',
    'd3',
    'base/utils',
    'base/component',
    'jqueryui_slider'
], function($, d3, utils, Component) {

    var container,
        timeslider,
        handle;

    var Timeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/slider/slider";

            // Same constructor as the superclass
            this._super(parent, options);
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

            var data = this.model.getData()[0],
                minValue = d3.min(data, function(d) {
                    return +d.year;
                }),
                maxValue = d3.max(data, function(d) {
                    return +d.year;
                });

            timeslider.slider({
                min: minValue,
                max: maxValue,
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