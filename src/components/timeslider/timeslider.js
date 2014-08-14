//TODO: refactor this whole thing
//TODO: timeslider is composed of jquery button and jquery slider and packed into one, since they can extend 

//TODO: differentiate between chart componenst and others by viz- word

define([
    'jquery',
    'd3',
    'base/utils',
    'base/component'
], function($, d3, utils, Component) {


    //plugin variables
    var container,
        timeslider,
        drag,
        lineBefore,
        lifeAfter,
        offset = null,
        range = null,
        playInterval,
        speed = 200,
        timesliderClass;


    var Timeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/timeslider/timeslider";

            // Same constructor as the superclass
            this._super(parent, options);
            timesliderClass = this;
        },

        postRender: function() {
            this.placeholder = utils.d3ToJquery(this.placeholder);
            container = this.placeholder.find("#time-slider-container");
            timeslider = container.find("#time-slider");
            drag = timeslider.find("#time-slider-drag");
            lineBefore = timeslider.find(".time-slider-line.before");
            lineAfter = timeslider.find(".time-slider-line.after");

            var play = container.find("#time-slider-play"),
                pause = container.find("#time-slider-pause");


            play.click(function() {
                startPlaying();
            });

            pause.click(function() {
                stopPlaying();
            });

            this.update();
            drag.bind("touchstart mousedown", startDrag);
        },


        resize: function() {
            this.update();
        },

        update: function() {
             var data = this.model.getData()[0],
                indicator = this.model.getState("indicator"),
                minValue = d3.min(data, function(d) {
                    return +d.year;
                }),
                maxValue = d3.max(data, function(d) {
                    return +d.year;
                });

            range = [minValue, maxValue];

            var year = this.model.getState("time"),
                maxLeft = timeslider.outerWidth() - drag.outerWidth(),
                minLeft = 0,
                numYears = range[1] - range[0], //difference
                widthPeryear = maxLeft / numYears;

            var posYear = Math.round(widthPeryear * (year - range[0]));
            drag.css({
                left: posYear
            });
            drag.attr("data-year", year);
            setLines();
        },

        getYear: function() {
            return this.model.getState("time");
        },

        setYear: function(year, silent) {
            //update state
            this.setState({
                time: year
            }, silent);

            this.update();
        },

    });

    var moveDrag = function(event) {
        event.preventDefault();
        var orig = event.originalEvent;
        var newTop, newLeft;
        if (orig.changedTouches) {
            newTop = orig.changedTouches[0].pageY - offset.y;
            newLeft = orig.changedTouches[0].pageX - offset.x;
        } else {
            newTop = orig.pageY - offset.y;
            newLeft = orig.pageX - offset.x;
        }
        //adjust max positions
        var maxTop = $(window).outerHeight() - timeslider.outerHeight(),
            maxLeft = timeslider.outerWidth() - drag.outerWidth(),
            minTop = 0,
            minLeft = 0;
        newTop = (newTop > maxTop) ? maxTop : newTop;
        newLeft = (newLeft > maxLeft) ? maxLeft : newLeft;
        newTop = (newTop < minTop) ? minTop : newTop;
        newLeft = (newLeft < minLeft) ? minLeft : newLeft;
        //apply positions
        // timeslider.css({
        //     top: newTop
        // });

        drag.css({
            left: newLeft
        });

        year = yearFromPosition();

        timesliderClass.setYear(year);

    };

    var startDrag = function(event) {
        stopPlaying();
        var orig = event.originalEvent;
        var posTimeSlider = timeslider.position();
        var posYear = drag.position();

        if (orig.changedTouches) {
            offset = {
                x: orig.changedTouches[0].pageX - posYear.left,
                y: orig.changedTouches[0].pageY - posTimeSlider.top
            };
        } else {
            offset = {
                x: orig.pageX - posYear.left,
                y: orig.pageY - posTimeSlider.top
            };
        }
        $(document).bind("touchmove mousemove", moveDrag);
        $(document).bind("touchend touchcancel mouseup", endDrag);
        drag.bind("touchend touchcancel mouseup change", endDrag);
        timeslider.addClass("dragging");
    };

    var endDrag = function(event) {
        $(document).unbind("touchmove mousemove");
        $(document).unbind("touchend touchcancel mouseup");
        drag.unbind("touchend touchcancel mouseup");
        timeslider.removeClass("dragging");

        var year = timesliderClass.getYear();
        timesliderClass.setYear(year);
    };

    var yearFromPosition = function() {
        var maxLeft = timeslider.outerWidth() - drag.outerWidth(),
            minLeft = 0,
            numYears = range[1] - range[0], //difference
            widthPeryear = maxLeft / numYears,
            posYear = drag.position().left;

        var yearValue = Math.round(posYear / widthPeryear) + range[0];

        return yearValue;
    };

    var setLines = function() {
        var maxLeft = timeslider.outerWidth(),
            minLeft = 0,
            posYear = drag.position().left,
            yearWidth = drag.outerWidth();

        lineBefore.css({
            left: minLeft,
            right: maxLeft - posYear
        });

        lineAfter.css({
            left: minLeft + posYear + yearWidth,
            right: 0
        });
    };

    var startPlaying = function() {
        container.addClass("playing");
        var yearValue = timesliderClass.getYear();
        playInterval = setInterval(function() {
            if (yearValue > range[1]) {
                stopPlaying();
                return;
            } else {
                timesliderClass.setYear(yearValue++);
            }
        }, speed);
    };

    var stopPlaying = function() {
        container.removeClass("playing");
        clearInterval(playInterval);
    };


    return Timeslider;
});