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

        context._zoomZoomedDomains = {x:{zoomedMin: null, zoomedMax: null}, y:{zoomedMin: null, zoomedMax: null}};
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

                _this.draggingNow = true;

                //value protections and fallbacks
                if(isNaN(zoom) || zoom == null) zoom = zoomer.scale();
                if(isNaN(zoom) || zoom == null) zoom = 1;

                var sourceEvent = d3.event.sourceEvent;

                //TODO: this is a patch to fix #221. A proper code review of zoom and zoomOnRectangle logic is needed
                /*
                 * Mouse wheel and touchmove events set the zoom value
                 * independently of axis ratios. If the zoom event was triggered
                 * by a mouse wheel event scrolling down or touchmove event with
                 * more than 1 contact that sets zoom to 1, then set the axis
                 * ratios to 1 as well, which will fully zoom out.
                 */
                if(zoom === 1 && sourceEvent !== null &&
                    (sourceEvent.type === "wheel" && sourceEvent.deltaY > 0 ||
                     sourceEvent.type === "touchmove" && sourceEvent.touches.length > 1)) {
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

                var xPanOffset = _this.width * zoom * ratioX;
                var yPanOffset = _this.height * zoom * ratioY;

                var xRange = [0 * zoom * ratioX + pan[0], xPanOffset + pan[0]];
                var yRange = [yPanOffset + pan[1], 0 * zoom * ratioY + pan[1]];

                var xRangeBumped = _this._rangeBump(xRange);
                var yRangeBumped = _this._rangeBump(yRange);

                /*
                 * Shift xRange and yRange by the difference between the bumped
                 * ranges, which is scaled by the zoom factor. This accounts for
                 * the range bump, which controls a gutter around the
                 * bubblechart, while correctly zooming.
                 */
                var xRangeMinOffset = (xRangeBumped[0] - xRange[0]) * zoom * ratioX;
                var xRangeMaxOffset = (xRangeBumped[1] - xRange[1]) * zoom * ratioX;

                var yRangeMinOffset = (yRangeBumped[0] - yRange[0]) * zoom * ratioY;
                var yRangeMaxOffset = (yRangeBumped[1] - yRange[1]) * zoom * ratioY;

                xRange[0] = xRange[0] + xRangeMinOffset;
                xRange[1] = xRange[1] + xRangeMaxOffset;

                yRange[0] = yRange[0] + yRangeMinOffset;
                yRange[1] = yRange[1] + yRangeMaxOffset;

                // Calculate the maximum xRange and yRange available.
                var xRangeBounds = [0,  _this.width];
                var yRangeBounds = [_this.height, 0];

                var xRangeBoundsBumped = _this._rangeBump(xRangeBounds);
                var yRangeBoundsBumped = _this._rangeBump(yRangeBounds);

                /*
                 * Set the pan to account for the range bump by subtracting
                 * offsets and preventing panning past the range bump gutter.
                 */
                if(xRange[0] > xRangeBoundsBumped[0]) pan[0] = xRangeBoundsBumped[0] - xRangeMinOffset;
                if(xRange[1] < xRangeBoundsBumped[1]) pan[0] = xRangeBoundsBumped[1] - xRangeMaxOffset - xPanOffset;
                if(yRange[0] < yRangeBoundsBumped[0]) pan[1] = yRangeBoundsBumped[0] - yRangeMinOffset - yPanOffset;
                if(yRange[1] > yRangeBoundsBumped[1]) pan[1] = yRangeBoundsBumped[1] - yRangeMaxOffset;

                zoomer.translate(pan);

                /*
                 * Clamp the xRange and yRange by the amount that the bounds
                 * that are range bumped.
                 *
                 * Additionally, take the amount clamped on the end of the range
                 * and either subtract or add it to the range's other end. This
                 * prevents visible stretching of the range when only panning.
                 */
                if(xRange[0] > xRangeBoundsBumped[0]) {
                    xRange[1] = xRange[1] - Math.abs(xRange[0] - xRangeBoundsBumped[0]);
                    xRange[0] = xRangeBoundsBumped[0];
                }

                if(xRange[1] < xRangeBoundsBumped[1]) {
                    xRange[0] = xRange[0] + Math.abs(xRange[1] - xRangeBoundsBumped[1]);
                    xRange[1] = xRangeBoundsBumped[1];
                }

                if(yRange[0] < yRangeBoundsBumped[0]) {
                    yRange[1] = yRange[1] + Math.abs(yRange[0] - yRangeBoundsBumped[0]);
                    yRange[0] = yRangeBoundsBumped[0];
                }

                if(yRange[1] > yRangeBoundsBumped[1]) {
                    yRange[0] = yRange[0] - Math.abs(yRange[1] - yRangeBoundsBumped[1]);
                    yRange[1] = yRangeBoundsBumped[1];
                }

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

                var zoomedXRange = xRangeBoundsBumped;
                var zoomedYRange = yRangeBoundsBumped;

                /*
                 * Set the zoomed min/max to the correct value depending on if the
                 * min/max values lie within the range bound regions.
                 */
                zoomedXRange[0] = xRangeBounds[0] > xRange[0] ? xRangeBounds[0] : xRange[0];
                zoomedXRange[1] = xRangeBounds[1] < xRange[1] ? xRangeBounds[1] : xRange[1];
                zoomedYRange[0] = yRangeBounds[0] < yRange[0] ? yRangeBounds[0] : yRange[0];
                zoomedYRange[1] = yRangeBounds[1] > yRange[1] ? yRangeBounds[1] : yRange[1];

                _this._zoomZoomedDomains = {
                    x: {
                     zoomedMin: formatter(_this.xScale.invert(zoomedXRange[0])),
                     zoomedMax: formatter(_this.xScale.invert(zoomedXRange[1]))
                    },
                    y: {
                     zoomedMin: formatter(_this.yScale.invert(zoomedYRange[0])),
                     zoomedMax: formatter(_this.yScale.invert(zoomedYRange[1]))
                    }
                }

                _this.model.marker.axis_x.set(_this._zoomZoomedDomains.x, null, false /*avoid storing it in URL*/);
                _this.model.marker.axis_y.set(_this._zoomZoomedDomains.y, null, false /*avoid storing it in URL*/);

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

                //Force the update of the URL and history, with the same values
                _this.model.marker.axis_x.set(_this._zoomZoomedDomains.x, true, true);
                _this.model.marker.axis_y.set(_this._zoomZoomedDomains.y, true, true);
            }
        };
    },

    expandCanvas: function(duration) {
        var _this = this.context;
        if (!duration) duration = _this.duration;

        //d3 extent returns min and max of the input array as [min, max]
        var mmX = d3.extent(utils.values(_this.frame.axis_x));
        var mmY = d3.extent(utils.values(_this.frame.axis_y));
        var radiusMax = utils.areaToRadius(_this.sScale( d3.extent(utils.values(_this.frame.size))[1] )) || 0;
        
        //protection agains unreasonable min-max results -- abort function
        if (!mmX[0] && mmX[0]!==0 || !mmX[1] && mmX[1]!==0 || !mmY[0] && mmY[0]!==0 || !mmY[1] && mmY[1]!==0) {
          return utils.warn("panZoom.expandCanvas: X or Y min/max are broken. Aborting with no action");
        }
        /*
         * Use a range bumped scale to correctly accommodate the range bump
         * gutter.
         */
        var suggestedFrame = {
            x1: _this.xScale(mmX[0]) - radiusMax,
            y1: _this.yScale(mmY[0]) + radiusMax,
            x2: _this.xScale(mmX[1]) + radiusMax,
            y2: _this.yScale(mmY[1]) - radiusMax
        };
        var xBounds = [0, _this.width];
        var yBounds = [_this.height, 0];

        // Get the current zoom frame based on the current dimensions.
        var frame = {
            x1: xBounds[0],
            x2: xBounds[1],
            y1: yBounds[0],
            y2: yBounds[1]
        };

        var TOLERANCE = .0;

        /*
         * If there is no current zoom frame, or if any of the suggested frame
         * points extend outside of the current zoom frame, then expand the
         * canvas.
         */
        if(!_this.isCanvasPreviouslyExpanded ||
            suggestedFrame.x1 < frame.x1 * (1 - TOLERANCE) || suggestedFrame.x2 > frame.x2 * (1 + TOLERANCE) ||
            suggestedFrame.y2 < frame.y2 * (1 - TOLERANCE) || suggestedFrame.y1 > frame.y1 * (1 + TOLERANCE)) {
            /*
             * If there is already a zoom frame, then clamp the suggested frame
             * points to only zoom out and expand the canvas.
             *
             * If any of x1, x2, y1, or y2 is within the current frame
             * boundaries, then clamp them to the frame boundaries. If any of
             * the above values will translate into a data value that is outside
             * of the possible data range, then clamp them to the frame
             * coordinate that corresponds to the maximum data value that can
             * be displayed.
             */
            if (_this.isCanvasPreviouslyExpanded) {
                /*
                 * Calculate bounds and bumped scale for calculating the data boundaries
                 * to which the suggested frame points need to be clamped.
                 */
                var xBoundsBumped = _this._rangeBump(xBounds);
                var yBoundsBumped = _this._rangeBump(yBounds);

                var xScaleBoundsBumped = _this.xScale.copy()
                    .range(xBoundsBumped);
                var yScaleBoundsBumped = _this.yScale.copy()
                    .range(yBoundsBumped);

                var xDataBounds = [xScaleBoundsBumped.invert(xBounds[0]), xScaleBoundsBumped.invert(xBounds[1])];
                var yDataBounds = [yScaleBoundsBumped.invert(yBounds[0]), yScaleBoundsBumped.invert(yBounds[1])];

                if (suggestedFrame.x1 > 0)
                    suggestedFrame.x1 = 0;
                else if (_this.xScale.invert(suggestedFrame.x1) < xDataBounds[0])
                    suggestedFrame.x1 = _this.xScale(xDataBounds[0]);

                if (suggestedFrame.x2 < _this.width)
                    suggestedFrame.x2 = _this.width;
                else if (_this.xScale.invert(suggestedFrame.x2) > xDataBounds[1])
                    suggestedFrame.x2 = _this.xScale(xDataBounds[1]);

                if (suggestedFrame.y1 < _this.height)
                    suggestedFrame.y1 = _this.height;
                else if (_this.yScale.invert(suggestedFrame.y1) < yDataBounds[0])
                    suggestedFrame.y1 = _this.yScale(yDataBounds[0]);

                if (suggestedFrame.y2 > 0)
                    suggestedFrame.y2 = 0;
                else if (_this.yScale.invert(suggestedFrame.y2) > yDataBounds[1])
                    suggestedFrame.y2 = _this.yScale(yDataBounds[1]);
            }

            _this.isCanvasPreviouslyExpanded = true;
            this._zoomOnRectangle(_this.element, suggestedFrame.x1, suggestedFrame.y1,
                suggestedFrame.x2, suggestedFrame.y2, false, duration);
        } else {
            _this.redrawDataPoints(duration);
        }
    },

    zoomToMaxMin: function(zoomedMinX, zoomedMaxX, zoomedMinY, zoomedMaxY, duration){
        var _this = this.context;
        var minX = zoomedMinX;
        var maxX = zoomedMaxX;
        var minY = zoomedMinY;
        var maxY = zoomedMaxY;

        var xRangeBounds = [0, _this.width];
        var yRangeBounds = [_this.height, 0];

        var xDomain = _this.xScale.domain();
        var yDomain = _this.yScale.domain();

        // Clamp zoomed values to maximum and minimum values.
        if (minX < xDomain[0]) minX = xDomain[0];
        if (maxX > xDomain[1]) maxX = xDomain[1];
        if (minY < yDomain[0]) minY = yDomain[0];
        if (maxY > yDomain[1]) maxY = yDomain[1];

        /*
         * Define TOLERANCE value as Number.EPSILON if exists, otherwise use
         * ES6 standard value.
         */
        var TOLERANCE = Number.EPSILON ? Number.EPSILON : 2.220446049250313e-16;

        /*
         * Check if the range bump region is currently displayed, i.e. for the
         * minX range bump region, check:
         * _this.xScale.invert(xRangeBounds[0]) < _this.xScale.domain()[0]
         *
         * Also check if the given min/max values equal the domain edges.
         * If so, then set the min/max values according to their range bumped
         * values. These values are used to calculate the correct rectangle
         * points for zooming.
         */
        if (_this.xScale.invert(xRangeBounds[0]) < xDomain[0]
            && Math.abs(minX - xDomain[0]) < TOLERANCE) {
            minX = _this.xScale.invert(xRangeBounds[0]);
        }

        if (_this.xScale.invert(xRangeBounds[1]) > xDomain[1]
            && Math.abs(maxX - xDomain[1]) < TOLERANCE) {
            maxX = _this.xScale.invert(xRangeBounds[1]);
        }

        if (_this.yScale.invert(yRangeBounds[0]) < yDomain[0]
            && Math.abs(minY - yDomain[0]) < TOLERANCE) {
            minY = _this.yScale.invert(yRangeBounds[0]);
        }

        if (_this.yScale.invert(yRangeBounds[1]) > yDomain[1]
            && Math.abs(maxY - yDomain[1]) < TOLERANCE) {
            maxY = _this.yScale.invert(yRangeBounds[1]);
        }

        var xRange = [_this.xScale(minX), _this.xScale(maxX)];
        var yRange = [_this.yScale(minY), _this.yScale(maxY)];

        this._zoomOnRectangle(_this.element, xRange[0], yRange[0], xRange[1], yRange[1], false, duration);
    },

    _zoomOnRectangle: function(element, zoomedX1, zoomedY1, zoomedX2, zoomedY2, compensateDragging, duration) {
        var _this = this.context;
        var zoomer = this.zoomer;

        var x1 = zoomedX1;
        var y1 = zoomedY1;
        var x2 = zoomedX2;
        var y2 = zoomedY2;

        /*
         * When dragging to draw a rectangle, the translate vector has (x2 - x1)
         * added to zoomer.translate()[0], and (y2 - 1) added to
         * zoomer.translate()[1].
         *
         * We need to compensate for this addition when
         * zooming with a rectangle, because zooming with a rectangle will
         * update the translate vector with new values based on the rectangle
         * dimensions.
         */
        if(compensateDragging) {
            zoomer.translate([
                zoomer.translate()[0] + x1 - x2,
                zoomer.translate()[1] + y1 - y2
            ])
        }

        var xRangeBounds = [0, _this.width];
        var yRangeBounds = [_this.height, 0];

        var xDomain = _this.xScale.domain();
        var yDomain = _this.yScale.domain();

        /*
         * If the min or max of one axis lies in the range bump region, then
         * changing the opposite end of that axis must correctly scale and
         * maintain the range bump region.
         */
        if (_this.xScale.invert(x1) < xDomain[0]) {
            x1 = this._scaleCoordinate(x1, xRangeBounds[1] - x2, _this.xScale.range()[0], xRangeBounds[1]);
        } else if (_this.xScale.invert(x2) < xDomain[0]) {
            x2 = this._scaleCoordinate(x2, xRangeBounds[1] - x1, _this.xScale.range()[0], xRangeBounds[1]);
        }

        if (_this.xScale.invert(x2) > xDomain[1]) {
            x2 = this._scaleCoordinate(x2, x1 - xRangeBounds[0], _this.xScale.range()[1], xRangeBounds[0]);
        } else if (_this.xScale.invert(x1) > xDomain[1]) {
            x1 = this._scaleCoordinate(x1, x2 - xRangeBounds[0], _this.xScale.range()[1], xRangeBounds[0]);
        }

        if (_this.yScale.invert(y1) < yDomain[0]) {
            y1 = this._scaleCoordinate(y1, y2 - yRangeBounds[1], _this.yScale.range()[0], yRangeBounds[1]);
        } else if (_this.yScale.invert(y2) < yDomain[0]) {
            y2 = this._scaleCoordinate(y2, y1 - yRangeBounds[1], _this.yScale.range()[0], yRangeBounds[1]);
        }

        if (_this.yScale.invert(y2) > yDomain[1]) {
            y2 = this._scaleCoordinate(y2, yRangeBounds[0] - y1, _this.yScale.range()[1], yRangeBounds[0]);
        } else if (_this.yScale.invert(y1) > yDomain[1]) {
            y1 = this._scaleCoordinate(y1, yRangeBounds[0] - y2, _this.yScale.range()[1], yRangeBounds[0]);
        }

        if(Math.abs(x1 - x2) < 10 || Math.abs(y1 - y2) < 10) return;

        var maxZoom = zoomer.scaleExtent()[1];

        if(Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            var zoom = _this.height / Math.abs(y1 - y2) * zoomer.scale();

            /*
             * Clamp the zoom scalar to the maximum zoom allowed before
             * calculating the next ratioX and ratioY.
             */
            if (zoom > maxZoom) zoom = maxZoom;

            var ratioX = _this.width / Math.abs(x1 - x2) * zoomer.scale() / zoom * zoomer.ratioX;
            var ratioY = zoomer.ratioY;
        } else {
            var zoom = _this.width / Math.abs(x1 - x2) * zoomer.scale();

            /*
             * Clamp the zoom scalar to the maximum zoom allowed before
             * calculating the next ratioX and ratioY.
             */
            if (zoom > maxZoom) zoom = maxZoom;

            var ratioY = _this.height / Math.abs(y1 - y2) * zoomer.scale() / zoom * zoomer.ratioY;
            var ratioX = zoomer.ratioX;
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

    /*
     * Helper function that returns a scaled coordinate value based on the
     * distance between the given coordinate and the data boundary.
     */
    _scaleCoordinate: function(coordValue, scaleDifference, dataBoundary, viewportBoundary) {
        var scalar = scaleDifference / Math.abs(dataBoundary - viewportBoundary);
        return (coordValue - dataBoundary) * (1 - scalar) + dataBoundary;
    },

    reset: function(element) {
        var _this = this.context;
        _this.isCanvasPreviouslyExpanded = false;

        this.zoomer.scale(1);
        this.zoomer.ratioY = 1;
        this.zoomer.ratioX = 1;
        this.zoomer.translate([0, 0]);
        this.zoomer.duration = 0;
        this.zoomer.event(element || _this.element);
    },

    rerun: function(element) {
        var _this = this.context;
        this.zoomer.event(element || _this.element);
    }
});
