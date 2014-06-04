define([
    'd3',
    'widgets/widget'
], function(d3, Widget) {


    //plugin variables
    var timeslider,
        drag,
        lineBefore,
        lifeAfter,
        offset = null,
        range = null,
        startYear = null,
        playInterval,
        speed = 300;


    var Timeslider = Widget.extend({
        init: function(core, options) {
            this.template = "widgets/timeslider/timeslider";

            // Same constructor as the superclass
            this._super(core, options);
            range = options.state.timeRange;
            startYear = options.state.time;
        },

        postRender: function() {
            timeslider = $("#timeslider #time-slider");
            drag = $("#timeslider #time-slider-drag");
            lineBefore = $("#timeslider .time-slider-line.before");
            lineAfter = $("#timeslider .time-slider-line.after");

            var play = $("#timeslider #time-slider-play"),
                pause = $("#timeslider #time-slider-pause");

            play.click(function() {
                startPlaying();
            });
            pause.click(function() {
                stopPlaying();
            });

            setYear(startYear);
            drag.bind("touchstart mousedown", startDrag);
        },

        resize: function() {
            var yearValue = getYear();
            setYear(yearValue);
        }

    });

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

    //start moving
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

        yearFromPosition();

        var yearValue = getYear();
        setYear(yearValue);

    };

    var endDrag = function(event) {
        $(document).unbind("touchmove mousemove");
        $(document).unbind("touchend touchcancel mouseup");
        drag.unbind("touchend touchcancel mouseup");
        timeslider.removeClass("dragging");

        var yearValue = getYear();
        setYear(yearValue);
    };

    var yearFromPosition = function() {
        var maxLeft = timeslider.outerWidth() - drag.outerWidth(),
            minLeft = 0,
            numYears = range[1] - range[0], //difference
            widthPeryear = maxLeft / numYears,
            posYear = drag.position().left;

        var yearValue = Math.floor(posYear / widthPeryear) + range[0];
        drag.attr("data-year", yearValue);
        setLines();
    };

    var setYear = function(yearValue) {
        var maxLeft = timeslider.outerWidth() - drag.outerWidth(),
            minLeft = 0,
            numYears = range[1] - range[0], //difference
            widthPeryear = maxLeft / numYears;

        var posYear = Math.floor(widthPeryear * (yearValue - range[0]));
        drag.css({
            left: posYear
        });
        drag.attr("data-year", yearValue);
        setLines();

        //update state
        sandbox.setState({
            year: yearValue
        });

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
        timeslider.closest("#timeslider").addClass("playing");
        var yearValue = getYear();
        playInterval = setInterval(function() {
            setYear(yearValue++);
            if (yearValue >= range[1]) {
                stopPlaying();
                return;
            }
        }, speed);
    };
    var stopPlaying = function() {
        timeslider.closest("#timeslider").removeClass("playing");
        clearInterval(playInterval);
    };

    var getYear = function() {
        return drag.attr('data-year');
    };


    return Timeslider;
});