import * as utils from 'base/utils';
import Class from 'base/class';

export default Class.extend({

    init: function(context) {
        this.context = context;

        this.enabled = false;

        this.dragRectangle = d3.behavior.drag();
        this.zoomer = d3.behavior.zoom();

        this.dragRectangle
            .on("dragstart", this.drag().start)
            .on("drag", this.drag().go)
            .on("dragend", this.drag().stop);

        this.zoomer
            .scaleExtent([1, 100])
            .on("zoom", this.zoom().go)
            .on('zoomend', this.zoom().stop);

        this.zoomer.ratioX = 1;
        this.zoomer.ratioY = 1;
    },


    drag: function(){
        var _this = this.context;
        var self = this;

        return {
            start: function(d, i) {
                if(!(d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;

                this.ctrlKeyLock = true;
                this.origin = {
                    x: d3.mouse(this)[0],
                    y: d3.mouse(this)[1]
                };
                _this.zoomRect.classed("vzb-invisible", false);

            },

            go: function(d, i) {
                if(!this.ctrlKeyLock) return;
                var origin = this.origin;
                var mouse = {
                    x: d3.event.x,
                    y: d3.event.y
                };

                _this.zoomRect
                    .attr("x", Math.min(mouse.x, origin.x))
                    .attr("y", Math.min(mouse.y, origin.y))
                    .attr("width", Math.abs(mouse.x - origin.x))
                    .attr("height", Math.abs(mouse.y - origin.y));
            },

            stop: function(e) {
                if(!this.ctrlKeyLock) return;
                this.ctrlKeyLock = false;

                _this.zoomRect
                    .attr("width", 0)
                    .attr("height", 0)
                    .classed("vzb-invisible", true);

                this.target = {
                    x: d3.mouse(this)[0],
                    y: d3.mouse(this)[1]
                };

                self._zoomOnRectangle(
                    d3.select(this),
                    this.origin.x,
                    this.origin.y,
                    this.target.x,
                    this.target.y,
                    true, 500
                );
            }
        };
    },


    zoom: function() {
        var _this = this.context;
        var zoomer = this.zoomer;
        var self = this;

        return {
            go: function() {


                if(d3.event.sourceEvent != null && (d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;


                //console.log("zoom")
                //send the event to the page if fully zoomed our or page not scrolled into view
//
//                    if(d3.event.scale == 1)
//
//                    if(utils.getViewportPosition(_this.element.node()).y < 0 && d3.event.scale > 1) {
//                        _this.scrollableAncestor.scrollTop += d3.event.sourceEvent.deltaY;
//                        return;
//                    }
                if(d3.event.sourceEvent != null && _this.scrollableAncestor) {
                    if(d3.event.sourceEvent != null && !self.enabled){
                        _this.scrollableAncestor.scrollTop += d3.event.sourceEvent.deltaY;
                        zoomer.scale(1)
                        return;
                    }
                }

                _this.model._data.entities.clearHighlighted();
                _this._setTooltip();

                var zoom = d3.event.scale;
                var pan = d3.event.translate;
                var ratioY = zoomer.ratioY;
                var ratioX = zoomer.ratioX;


                // console.log(d3.event.scale, zoomer.ratioY, zoomer.ratioX)

                _this.draggingNow = true;

                //value protections and fallbacks
                if(isNaN(zoom) || zoom == null) zoom = zoomer.scale();
                if(isNaN(zoom) || zoom == null) zoom = 1;

                //TODO: this is a patch to fix #221. A proper code review of zoom and zoomOnRectangle logic is needed
                if(zoom == 1) {
                    zoomer.ratioX = 1;
                    ratioX = 1;
                    zoomer.ratioY = 1;
                    ratioY = 1
                }

                if(isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = zoomer.translate();
                if(isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = [0, 0];


                // limit the zooming, so that it never goes below 1 for any of the axes
                if(zoom * ratioY < 1) {
                    ratioY = 1 / zoom;
                    zoomer.ratioY = ratioY
                }
                if(zoom * ratioX < 1) {
                    ratioX = 1 / zoom;
                    zoomer.ratioX = ratioX
                }

                //limit the panning, so that we are never outside the possible range
                if(pan[0] > 0) pan[0] = 0;
                if(pan[1] > 0) pan[1] = 0;
                if(pan[0] < (1 - zoom * ratioX) * _this.width) pan[0] = (1 - zoom * ratioX) * _this.width;
                if(pan[1] < (1 - zoom * ratioY) * _this.height) pan[1] = (1 - zoom * ratioY) * _this.height;
                zoomer.translate(pan);

                var xRange = [0 * zoom * ratioX + pan[0], _this.width * zoom * ratioX + pan[0]];
                var yRange = [_this.height * zoom * ratioY + pan[1], 0 * zoom * ratioY + pan[1]];

                var xRangeBumped = _this._rangeBump(xRange);
                var yRangeBumped = _this._rangeBump(yRange);

                /*
                 * Shift xRange and yRange by the difference between the bumped
                 * ranges, which is scaled by the zoom factor. This accounts for
                 * the range bump, which controls a gutter around the
                 * bubblechart, while correctly zooming.
                 */
                xRange[0] = xRange[0] + (xRangeBumped[0] - xRange[0]) * zoom * ratioX;
                xRange[1] = xRange[1] + (xRangeBumped[1] - xRange[1]) * zoom * ratioX;

                yRange[0] = yRange[0] + (yRangeBumped[0] - yRange[0]) * zoom * ratioY;
                yRange[1] = yRange[1] + (yRangeBumped[1] - yRange[1]) * zoom * ratioY;

                // Calculate the maximum xRange and yRange available.
                var xRangeBounds = [0,  _this.width];
                var yRangeBounds = [_this.height, 0];

                var xRangeBoundsBumped = _this._rangeBump(xRangeBounds);
                var yRangeBoundsBumped = _this._rangeBump(yRangeBounds);

                /*
                 * Clamp the xRange and yRange by the amount that the bounds
                 * that are range bumped.
                 */
                if(xRange[0] > xRangeBoundsBumped[0]) xRange[0] = xRangeBoundsBumped[0];
                if(xRange[1] < xRangeBoundsBumped[1]) xRange[1] = xRangeBoundsBumped[1];

                if(yRange[0] < yRangeBoundsBumped[0]) yRange[0] = yRangeBoundsBumped[0];
                if(yRange[1] > yRangeBoundsBumped[1]) yRange[1] = yRangeBoundsBumped[1];

                if(_this.model.marker.axis_x.scaleType === 'ordinal'){
                    _this.xScale.rangeBands(xRange);
                }else{
                    _this.xScale.range(xRange);
                }

                if(_this.model.marker.axis_y.scaleType === 'ordinal'){
                    _this.yScale.rangeBands(yRange);
                }else{
                    _this.yScale.range(yRange);
                }

                var formatter = function(n) { return d3.round(n, 2); };
                _this.model.marker.axis_x.fakeMin = formatter(_this.xScale.invert(xRangeBoundsBumped[0]));
                _this.model.marker.axis_x.fakeMax = formatter(_this.xScale.invert(xRangeBoundsBumped[1]));
                _this.model.marker.axis_y.fakeMin = formatter(_this.yScale.invert(yRangeBoundsBumped[0]));
                _this.model.marker.axis_y.fakeMax = formatter(_this.yScale.invert(yRangeBoundsBumped[1]));

                // Keep the min and max size (pixels) constant, when zooming.
                //                    _this.sScale.range([utils.radiusToArea(_this.minRadius) * zoom * zoom * ratioY * ratioX,
                //                                        utils.radiusToArea(_this.maxRadius) * zoom * zoom * ratioY * ratioX ]);

                var optionsY = _this.yAxis.labelerOptions();
                var optionsX = _this.xAxis.labelerOptions();
                optionsY.limitMaxTickNumber = zoom * ratioY < 2 ? 7 : 14;
                optionsY.transitionDuration = zoomer.duration;
                optionsX.transitionDuration = zoomer.duration;

                _this.xAxisEl.call(_this.xAxis.labelerOptions(optionsX));
                _this.yAxisEl.call(_this.yAxis.labelerOptions(optionsY));
                _this.redrawDataPoints(zoomer.duration);
                _this._trails.run("resize", null, zoomer.duration);

                zoomer.duration = 0;
            },

            stop: function(){
                _this.draggingNow = false;
            }
        };
    },





    expandCanvas: function() {
        var _this = this.context;

        var mmmX = _this.xyMaxMinMean.x[_this.timeFormatter(_this.time)];
        var mmmY = _this.xyMaxMinMean.y[_this.timeFormatter(_this.time)];
        var radiusMax = utils.areaToRadius(_this.sScale(_this.xyMaxMinMean.s[_this.timeFormatter(_this.time)].max));
        var frame = _this.currentZoomFrameXY;

        var suggestedFrame = {
            x1: _this.xScale(mmmX.min) - radiusMax,
            y1: _this.yScale(mmmY.min) + radiusMax,
            x2: _this.xScale(mmmX.max) + radiusMax,
            y2: _this.yScale(mmmY.max) - radiusMax
        };

        var TOLERANCE = .0;

        if(!frame || suggestedFrame.x1 < frame.x1 * (1 - TOLERANCE) || suggestedFrame.x2 > frame.x2 * (1 + TOLERANCE) ||
            suggestedFrame.y2 < frame.y2 * (1 - TOLERANCE) || suggestedFrame.y1 > frame.y1 * (1 + TOLERANCE)) {
            _this.currentZoomFrameXY = utils.clone(suggestedFrame);
            var frame = _this.currentZoomFrameXY;
            this._zoomOnRectangle(_this.element, frame.x1, frame.y1, frame.x2, frame.y2, false, _this.duration);
            //console.log("rezoom")
        } else {
            _this.redrawDataPoints(_this.duration);
            //console.log("no rezoom")
        }
    },


    zoomToMaxMin: function(minX, maxX, minY, maxY, duration){
        var _this = this.context;

        var xRange = _this._rangeBump([_this.xScale(minX), _this.xScale(maxX)], "undo");
        var yRange = _this._rangeBump([_this.yScale(minY), _this.yScale(maxY)], "undo");

        this._zoomOnRectangle(_this.element, xRange[0], yRange[0], xRange[1], yRange[1], false, duration);

    },


    _zoomOnRectangle: function(element, x1, y1, x2, y2, compensateDragging, duration) {
        var _this = this.context;
        var zoomer = this.zoomer;

        if(Math.abs(x1 - x2) < 10 || Math.abs(y1 - y2) < 10) return;

        if(Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            var zoom = _this.height / Math.abs(y1 - y2) * zoomer.scale();
            var ratioX = _this.width / Math.abs(x1 - x2) * zoomer.scale() / zoom * zoomer.ratioX;
            var ratioY = zoomer.ratioY;
        } else {
            var zoom = _this.width / Math.abs(x1 - x2) * zoomer.scale();
            var ratioY = _this.height / Math.abs(y1 - y2) * zoomer.scale() / zoom * zoomer.ratioY;
            var ratioX = zoomer.ratioX;
        }

        if(compensateDragging) {
            zoomer.translate([
                zoomer.translate()[0] + x1 - x2,
                zoomer.translate()[1] + y1 - y2
            ])
        }

        var pan = [
            (zoomer.translate()[0] - Math.min(x1, x2)) / zoomer.scale() / zoomer.ratioX * zoom * ratioX,
            (zoomer.translate()[1] - Math.min(y1, y2)) / zoomer.scale() / zoomer.ratioY * zoom * ratioY
        ];

        zoomer.scale(zoom);
        zoomer.ratioY = ratioY;
        zoomer.ratioX = ratioX;
        zoomer.translate(pan);
        zoomer.duration = duration ? duration : 0;

        zoomer.event(element);
    },

    reset: function(element) {
        var _this = this.context;
        _this.currentZoomFrameXY = null;

        this.zoomer.scale(1);
        this.zoomer.ratioY = 1;
        this.zoomer.ratioX = 1;
        this.zoomer.translate([0, 0]);
        this.zoomer.duration = 0;
        this.zoomer.event(element || _this.element);
    }



});
