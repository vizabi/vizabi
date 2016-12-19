import * as utils from 'base/utils';
import Class from 'base/class';

export default Class.extend({

    init: function(context) {
        this.context = context;

        this.dragRectangle = d3.behavior.drag();
        this.zoomer = d3.behavior.zoom();

        this.dragLock = false;

        this.dragRectangle
            .on("dragstart", this.drag().start)
            .on("drag", this.drag().go)
            .on("dragend", this.drag().stop);

        this.zoomer
            .on("zoomstart", this.zoom().start)
            .on("zoom", this.zoom().go)
            .on('zoomend', this.zoom().stop);

        this.zoomer.ratioX = 1;
        this.zoomer.ratioY = 1;

        context._zoomedXYMinMax = {axis_x:{zoomedMin: null, zoomedMax: null}, axis_y:{zoomedMin: null, zoomedMax: null}};
    },

    drag: function(){
        var _this = this.context;
        var self = this;

        return {
            start: function(d, i) {
                /*
                 * Do not drag if the Ctrl key, Meta key, or plus cursor mode is
                 * not enabled. Also do not drag if zoom-pinching on touchmove
                 * events.
                 */
              if(!(d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey ||
                     _this.ui.cursorMode === "plus") ||
                     (d3.event.sourceEvent.type === "touchmove" || d3.event.sourceEvent.type === "touchstart") &&
                     (d3.event.sourceEvent.touches.length > 1 || d3.event.sourceEvent.targetTouches.length > 1)) {
                    return;
                }

                self.dragLock = true;
                this.origin = {
                    x: d3.mouse(this)[0],
                    y: d3.mouse(this)[1]
                };
                _this.zoomRect.classed("vzb-invisible", false);
            },

            go: function(d, i) {
                /*
                 * Cancel drag if drag lock is false, or when zoom-pinching via
                 * touchmove events.
                 */
              if(!self.dragLock || (d3.event.sourceEvent.type === "touchmove" || d3.event.sourceEvent.type === "touchstart") &&
                    (d3.event.sourceEvent.touches.length > 1 || d3.event.sourceEvent.targetTouches.length > 1)) {
                    self.dragLock = false;

                    _this.zoomRect
                        .attr("width", 0)
                        .attr("height", 0)
                        .classed("vzb-invisible", true);

                    return;
                }

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
              if(!self.dragLock) return;
              self.dragLock = false;

                _this.zoomRect
                    .attr("width", 0)
                    .attr("height", 0)
                    .classed("vzb-invisible", true);

                this.target = {
                    x: d3.mouse(this)[0],
                    y: d3.mouse(this)[1]
                };
                if(Math.abs(this.origin.x - this.target.x) < 10 || Math.abs(this.origin.y - this.target.y) < 10) return;

                /*
                 * Only compensate for dragging when the Ctrl key or Meta key
                 * are pressed, or if the cursorMode is not in plus mode.
                 */
                var compensateDragging = d3.event.sourceEvent.ctrlKey ||
                    d3.event.sourceEvent.metaKey ||
                    _this.ui.cursorMode === "plus";

                self._zoomOnRectangle(
                    d3.select(this),
                    this.origin.x,
                    this.origin.y,
                    this.target.x,
                    this.target.y,
                    compensateDragging, 500
                );
            }
        };
    },

    zoom: function() {
        var _this = this.context;
        var zoomer = this.zoomer;
        var self = this;

        return {
            start: function() {
                this.savedScale = zoomer.scale();
            },
            go: function() {

                var sourceEvent = d3.event.sourceEvent;

                if(sourceEvent != null && (sourceEvent.ctrlKey || sourceEvent.metaKey)) return;

                // Cancel drag lock when zoom-pinching via touchmove events.
                if (sourceEvent !== null &&
                    (sourceEvent.type === "touchmove" || sourceEvent.type === "touchstart") &&
                    (sourceEvent.touches.length > 1 || sourceEvent.targetTouches.length > 1)) {
                    self.dragLock = false;
                }

                if (self.dragLock) return;

                //send the event to the page if fully zoomed our or page not scrolled into view
//
//                    if(d3.event.scale == 1)
//
//                    if(utils.getViewportPosition(_this.element.node()).y < 0 && d3.event.scale > 1) {
//                        _this.scrollableAncestor.scrollTop += d3.event.sourceEvent.deltaY;
//                        return;
//                    }
                /*
                 * Do not zoom on the chart if the scroll event is a wheel
                 * scroll. Instead, redirect the scroll event to the scrollable
                 * ancestor
                 */
                if (sourceEvent != null && (sourceEvent.type === "wheel" || sourceEvent.type === "mousewheel") &&
                    !_this.ui.zoomOnScrolling) {
                    if (_this.scrollableAncestor) {
                        _this.scrollableAncestor.scrollTop += (sourceEvent.deltaY || -sourceEvent.wheelDelta);
                    }
                    d3.event.scale = null;
                    zoomer.scale(this.savedScale);
                    this.quitZoom = true;
                    return;
                }
                this.quitZoom = false;

                _this.model._data.marker.clearHighlighted();
                _this._setTooltip();

                var zoom = d3.event.scale;
                var pan = d3.event.translate;
                var ratioY = zoomer.ratioY;
                var ratioX = zoomer.ratioX;

                _this.draggingNow = true;

                //value protections and fallbacks
                if(isNaN(zoom) || zoom == null) zoom = zoomer.scale();
                if(isNaN(zoom) || zoom == null) zoom = 1;

                //TODO: this is a patch to fix #221. A proper code review of zoom and zoomOnRectangle logic is needed
                /*
                 * Mouse wheel and touchmove events set the zoom value
                 * independently of axis ratios. If the zoom event was triggered
                 * by a mouse wheel event scrolling down or touchmove event with
                 * more than 1 contact that sets zoom to 1, then set the axis
                 * ratios to 1 as well, which will fully zoom out.
                 */
                if(zoom === 1 && sourceEvent !== null &&
                    ((sourceEvent.type === "wheel" || sourceEvent.type === "mousewheel") && (sourceEvent.deltaY || -sourceEvent.wheelDelta) > 0 ||
                     sourceEvent.type === "touchmove" && sourceEvent.touches.length > 1)) {
                    zoomer.ratioX = 1;
                    ratioX = 1;
                    zoomer.ratioY = 1;
                    ratioY = 1
                }

                if(isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = zoomer.translate();
                if(isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = [0, 0];

                // limit the zooming, so that it never goes below min value of zoom for any of the axes
                var minZoomScale = zoomer.scaleExtent()[0];
                if(zoom * ratioY < minZoomScale) {
                    ratioY = minZoomScale / zoom;
                    zoomer.ratioY = ratioY
                }
                if(zoom * ratioX < minZoomScale) {
                    ratioX = minZoomScale / zoom;
                    zoomer.ratioX = ratioX
                }

                var zoomXOut = zoom * ratioX < 1;
                var zoomYOut = zoom * ratioY < 1;

                //limit the panning, so that we are never outside the possible range
                if(!zoomXOut) {
                    if(pan[0] > 0) pan[0] = 0;
                    if(pan[0] < (1 - zoom * ratioX) * _this.width) pan[0] = (1 - zoom * ratioX) * _this.width;
                } else {
                    if(pan[0] < 0) pan[0] = 0;
                    if(pan[0] > (1 - zoom * ratioX) * _this.width) pan[0] = (1 - zoom * ratioX) * _this.width;
                }

                if(!zoomYOut) {
                    if(pan[1] > 0) pan[1] = 0;
                    if(pan[1] < (1 - zoom * ratioY) * _this.height) pan[1] = (1 - zoom * ratioY) * _this.height;
                } else {
                    if(pan[1] < 0) pan[1] = 0;
                    if(pan[1] > (1 - zoom * ratioY) * _this.height) pan[1] = (1 - zoom * ratioY) * _this.height;
                }

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
                if(!zoomXOut) {
                    if(xRange[0] > xRangeBoundsBumped[0]) pan[0] = xRangeBoundsBumped[0] - xRangeMinOffset;
                    if(xRange[1] < xRangeBoundsBumped[1]) pan[0] = xRangeBoundsBumped[1] - xRangeMaxOffset - xPanOffset;
                } else {
                    if(xRange[0] < xRangeBoundsBumped[0]) pan[0] = xRangeBoundsBumped[0] - xRangeMinOffset;
                    if(xRange[1] > xRangeBoundsBumped[1]) pan[0] = xRangeBoundsBumped[1] - xRangeMaxOffset - xPanOffset;
                }

                if(!zoomYOut) {
                    if(yRange[0] < yRangeBoundsBumped[0]) pan[1] = yRangeBoundsBumped[0] - yRangeMinOffset - yPanOffset;
                    if(yRange[1] > yRangeBoundsBumped[1]) pan[1] = yRangeBoundsBumped[1] - yRangeMaxOffset;
                } else {
                    if(yRange[0] > yRangeBoundsBumped[0]) pan[1] = yRangeBoundsBumped[0] - yRangeMinOffset - yPanOffset;
                    if(yRange[1] < yRangeBoundsBumped[1]) pan[1] = yRangeBoundsBumped[1] - yRangeMaxOffset;
                }

                zoomer.translate(pan);

                /*
                 * Clamp the xRange and yRange by the amount that the bounds
                 * that are range bumped.
                 *
                 * Additionally, take the amount clamped on the end of the range
                 * and either subtract or add it to the range's other end. This
                 * prevents visible stretching of the range when only panning.
                 */
                if(!zoomXOut) {
                    if(xRange[0] > xRangeBoundsBumped[0]) {
                        xRange[1] = xRange[1] - Math.abs(xRange[0] - xRangeBoundsBumped[0]);
                        xRange[0] = xRangeBoundsBumped[0];
                    }

                    if(xRange[1] < xRangeBoundsBumped[1]) {
                        xRange[0] = xRange[0] + Math.abs(xRange[1] - xRangeBoundsBumped[1]);
                        xRange[1] = xRangeBoundsBumped[1];
                    }
                } else {
                    if(xRange[0] < xRangeBoundsBumped[0]) {
                        xRange[1] = xRange[1] + Math.abs(xRange[0] - xRangeBoundsBumped[0]);
                        xRange[0] = xRangeBoundsBumped[0];
                    }

                    if(xRange[1] > xRangeBoundsBumped[1]) {
                        xRange[0] = xRange[0] - Math.abs(xRange[1] - xRangeBoundsBumped[1]);
                        xRange[1] = xRangeBoundsBumped[1];
                    }
                }

                if(!zoomYOut) {
                    if(yRange[0] < yRangeBoundsBumped[0]) {
                        yRange[1] = yRange[1] + Math.abs(yRange[0] - yRangeBoundsBumped[0]);
                        yRange[0] = yRangeBoundsBumped[0];
                    }

                    if(yRange[1] > yRangeBoundsBumped[1]) {
                        yRange[0] = yRange[0] - Math.abs(yRange[1] - yRangeBoundsBumped[1]);
                        yRange[1] = yRangeBoundsBumped[1];
                    }
                } else {
                    if(yRange[0] > yRangeBoundsBumped[0]) {
                        yRange[1] = yRange[1] - Math.abs(yRange[0] - yRangeBoundsBumped[0]);
                        yRange[0] = yRangeBoundsBumped[0];
                    }

                    if(yRange[1] < yRangeBoundsBumped[1]) {
                        yRange[0] = yRange[0] + Math.abs(yRange[1] - yRangeBoundsBumped[1]);
                        yRange[1] = yRangeBoundsBumped[1];
                    }
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

                var formatter = function(n) { return utils.isDate(n)? n : d3.round(n, 2); };

                var zoomedXRange = xRangeBoundsBumped;
                var zoomedYRange = yRangeBoundsBumped;

                /*
                 * Set the zoomed min/max to the correct value depending on if the
                 * min/max values lie within the range bound regions.
                 */
                if(!zoomXOut) {
                    zoomedXRange[0] = xRangeBounds[0] > xRange[0] ? xRangeBounds[0] : xRange[0];
                    zoomedXRange[1] = xRangeBounds[1] < xRange[1] ? xRangeBounds[1] : xRange[1];
                }

                if(!zoomYOut) {
                    zoomedYRange[0] = yRangeBounds[0] < yRange[0] ? yRangeBounds[0] : yRange[0];
                    zoomedYRange[1] = yRangeBounds[1] > yRange[1] ? yRangeBounds[1] : yRange[1];
                }

                _this._zoomedXYMinMax = {
                  axis_x: {
                    zoomedMin: formatter(_this.xScale.invert(zoomedXRange[0])),
                    zoomedMax: formatter(_this.xScale.invert(zoomedXRange[1]))
                  },
                  axis_y: {
                    zoomedMin: formatter(_this.yScale.invert(zoomedYRange[0])),
                    zoomedMax: formatter(_this.yScale.invert(zoomedYRange[1]))
                  }
                }


                if(!zoomer.dontFeedToState) _this.model.marker.set(_this._zoomedXYMinMax, null, false /*avoid storing it in URL*/);

                // Keep the min and max size (pixels) constant, when zooming.
                //                    _this.sScale.range([utils.radiusToArea(_this.minRadius) * zoom * zoom * ratioY * ratioX,
                //                                        utils.radiusToArea(_this.maxRadius) * zoom * zoom * ratioY * ratioX ]);

                var optionsY = _this.yAxis.labelerOptions();
                var optionsX = _this.xAxis.labelerOptions();
                optionsY.limitMaxTickNumber = zoom * ratioY < 1.5 ? 8 : zoom * ratioY * 8;
                optionsX.limitMaxTickNumber = zoom * ratioX < 1.5 ? 8 : zoom * ratioX * 8;
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

                if (this.quitZoom) return;

                //Force the update of the URL and history, with the same values
                if(!zoomer.dontFeedToState) _this.model.marker.set(_this._zoomedXYMinMax, true, true);
                zoomer.dontFeedToState = null;
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

    zoomToMaxMin: function(zoomedMinX, zoomedMaxX, zoomedMinY, zoomedMaxY, duration, dontFeedToState){
        var _this = this.context;
        var minX = zoomedMinX;
        var maxX = zoomedMaxX;
        var minY = zoomedMinY;
        var maxY = zoomedMaxY;
        var zoomer = this.zoomer;

        var xRangeBounds = [0, _this.width];
        var yRangeBounds = [_this.height, 0];
        var xRangeBoundsBumped = _this._rangeBump(xRangeBounds);
        var yRangeBoundsBumped = _this._rangeBump(yRangeBounds);

        var xDomain = _this.xScale.domain();
        var yDomain = _this.yScale.domain();

        /*
         * Prevent zoomout if only one of zoom edges set outside domain
         */
        if(minX < xDomain[0] && maxX < xDomain[1]) minX = xDomain[0];
        if(minX > xDomain[0] && maxX > xDomain[1]) maxX = xDomain[1];
        if(minY < yDomain[0] && maxY < yDomain[1]) minY = yDomain[0];
        if(minY > yDomain[0] && maxY > yDomain[1]) maxY = yDomain[1];

        var zoomXOut = minX <= xDomain[0] && xDomain[1] <= maxX && (xDomain[1] - xDomain[0]) < (maxX - zoomedMinX);
        var zoomYOut = minY <= yDomain[0] && yDomain[1] <= maxY && (yDomain[1] - yDomain[0]) < (maxY - zoomedMinY);

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
        if (_this.xScale.invert(xRangeBounds[0]) < xDomain[0] && !zoomXOut
            && Math.abs(minX - xDomain[0]) < TOLERANCE) {
            minX = _this.xScale.invert(xRangeBounds[0]);
        }

        if (_this.xScale.invert(xRangeBounds[1]) > xDomain[1] && !zoomXOut
            && Math.abs(maxX - xDomain[1]) < TOLERANCE) {
            maxX = _this.xScale.invert(xRangeBounds[1]);
        }

        if (_this.yScale.invert(yRangeBounds[0]) < yDomain[0] && !zoomYOut
            && Math.abs(minY - yDomain[0]) < TOLERANCE) {
            minY = _this.yScale.invert(yRangeBounds[0]);
        }

        if (_this.yScale.invert(yRangeBounds[1]) > yDomain[1] && !zoomYOut
            && Math.abs(maxY - yDomain[1]) < TOLERANCE) {
            maxY = _this.yScale.invert(yRangeBounds[1]);
        }

        var xRange = [_this.xScale(minX), _this.xScale(maxX)];
        var yRange = [_this.yScale(minY), _this.yScale(maxY)];

        /*
         * Calculate correct pan for zoom out
         * Expand ranges to viewport and after shift them to pan
         */
        if(zoomXOut) {
            if(zoomedMaxX >= xDomain[1] && zoomedMinX <= xDomain[0]) {
                var scale = Math.abs(_this.xScale(xDomain[1]) - _this.xScale(xDomain[0])) / Math.abs(xRange[1] - xRange[0]);
                var bump = Math.abs(xRangeBoundsBumped[0] - xRangeBounds[0]);
                var deltaVB = Math.abs(xRangeBounds[1] - xRangeBounds[0]);
                var deltaVBBumped = Math.abs(xRangeBoundsBumped[1] - xRangeBoundsBumped[0]);

                var scaledPanX = zoomer.translate()[0] - zoomer.scale() * zoomer.ratioX * (1 / scale - 1) * (bump + deltaVBBumped * Math.abs(_this.xScale(xDomain[0]) - xRange[0]) / (Math.abs(xRange[1] - _this.xScale(xDomain[1]) + Math.abs(_this.xScale(xDomain[0]) - xRange[0]))));
                xRange[1] = (xRange[1] - xRange[0]) * deltaVB / deltaVBBumped + scaledPanX;
                xRange[0] = scaledPanX;
            }
        }

        if(zoomYOut) {
            if(zoomedMaxY >= yDomain[1] && zoomedMinY <= yDomain[0]) {
                var scale = Math.abs(_this.yScale(yDomain[0]) - _this.yScale(yDomain[1])) / Math.abs(yRange[0] - yRange[1]);
                var bump = Math.abs(yRangeBoundsBumped[1] - yRangeBounds[1]);
                var deltaVB = Math.abs(yRangeBounds[0] - yRangeBounds[1]);
                var deltaVBBumped = Math.abs(yRangeBoundsBumped[0] - yRangeBoundsBumped[1]);

                var scaledPanY = zoomer.translate()[1] - zoomer.scale() * zoomer.ratioY * ( 1 / scale - 1) * (bump + deltaVBBumped * Math.abs(_this.yScale(yDomain[1]) - yRange[1]) / (Math.abs(_this.yScale(yDomain[0]) - yRange[0]) + Math.abs(yRange[1] - _this.yScale(yDomain[1]))));
                yRange[0] = (yRange[0] - yRange[1]) * deltaVB / deltaVBBumped + scaledPanY;
                yRange[1] = scaledPanY;
            }
        }

        this._zoomOnRectangle(_this.element, xRange[0], yRange[0], xRange[1], yRange[1], false, duration, dontFeedToState);
    },

    _zoomOnRectangle: function(element, zoomedX1, zoomedY1, zoomedX2, zoomedY2, compensateDragging, duration, dontFeedToState) {
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
            ]);
        }

        var xRangeBounds = [0, _this.width];
        var yRangeBounds = [_this.height, 0];

        var xDomain = _this.xScale.domain();
        var yDomain = _this.yScale.domain();

        var zoomXOut = zoomer.scale() * zoomer.ratioX < 1;
        var zoomYOut = zoomer.scale() * zoomer.ratioY < 1;

        /*
         * If the min or max of one axis lies in the range bump region, then
         * changing the opposite end of that axis must correctly scale and
         * maintain the range bump region.
         */

        if (_this.xScale.invert(x1) < xDomain[0] && x1 >= xRangeBounds[0] && !zoomXOut) {
            x1 = this._scaleCoordinate(x1, xRangeBounds[1] - x2, _this.xScale.range()[0], xRangeBounds[1]);
        } else if (_this.xScale.invert(x2) < xDomain[0] && x2 >= xRangeBounds[0] && !zoomXOut) {
            x2 = this._scaleCoordinate(x2, xRangeBounds[1] - x1, _this.xScale.range()[0], xRangeBounds[1]);
        }

        if (_this.xScale.invert(x2) > xDomain[1] && x2 <= xRangeBounds[1] && !zoomXOut) {
            x2 = this._scaleCoordinate(x2, x1 - xRangeBounds[0], _this.xScale.range()[1], xRangeBounds[0]);
        } else if (_this.xScale.invert(x1) > xDomain[1] && x1 <= xRangeBounds[1] && !zoomXOut) {
            x1 = this._scaleCoordinate(x1, x2 - xRangeBounds[0], _this.xScale.range()[1], xRangeBounds[0]);
        }

        if (_this.yScale.invert(y1) < yDomain[0] && y1 <= yRangeBounds[0] && !zoomYOut) {
            y1 = this._scaleCoordinate(y1, y2 - yRangeBounds[1], _this.yScale.range()[0], yRangeBounds[1]);
        } else if (_this.yScale.invert(y2) < yDomain[0] && y2 <= yRangeBounds[0] && !zoomYOut) {
            y2 = this._scaleCoordinate(y2, y1 - yRangeBounds[1], _this.yScale.range()[0], yRangeBounds[1]);
        }

        if (_this.yScale.invert(y2) > yDomain[1] && y2 >= yRangeBounds[1] && !zoomYOut) {
            y2 = this._scaleCoordinate(y2, yRangeBounds[0] - y1, _this.yScale.range()[1], yRangeBounds[0]);
        } else if (_this.yScale.invert(y1) > yDomain[1] && y1 >= yRangeBounds[1] && !zoomYOut) {
            y1 = this._scaleCoordinate(y1, yRangeBounds[0] - y2, _this.yScale.range()[1], yRangeBounds[0]);
        }

        var minZoom = zoomer.scaleExtent()[0];
        var maxZoom = zoomer.scaleExtent()[1];

        if(Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            var zoom = _this.height / Math.abs(y1 - y2) * zoomer.scale();

            /*
             * Clamp the zoom scalar to the maximum zoom allowed before
             * calculating the next ratioX and ratioY.
             */
            if(zoom < minZoom) {
              zoomer.ratioY *= zoom / zoomer.scale(); 
              zoom = minZoom;
            }
            if (zoom > maxZoom) zoom = maxZoom;

            var ratioX = _this.width / Math.abs(x1 - x2) * zoomer.scale() / zoom * zoomer.ratioX;
            var ratioY = zoomer.ratioY;
        } else {
            var zoom = _this.width / Math.abs(x1 - x2) * zoomer.scale();

            /*
             * Clamp the zoom scalar to the maximum zoom allowed before
             * calculating the next ratioX and ratioY.
             */
            if(zoom < minZoom) {
              zoomer.ratioX *= zoom / zoomer.scale(); 
              zoom = minZoom;
            }
            if (zoom > maxZoom) zoom = maxZoom;

            var ratioY = _this.height / Math.abs(y1 - y2) * zoomer.scale() / zoom * zoomer.ratioY;
            var ratioX = zoomer.ratioX;
        }

        var pan = [
            (zoomer.translate()[0] - Math.min(x1, x2)) / zoomer.scale() / zoomer.ratioX * zoom * ratioX,
            (zoomer.translate()[1] - Math.min(y1, y2)) / zoomer.scale() / zoomer.ratioY * zoom * ratioY
        ];

        zoomer.dontFeedToState = dontFeedToState;
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

    /*
     * Calculate a proportional reduction of the scalar value. Also,
     * calculate the reduction of the value by a constant of 1.
     *
     * Return the larger of the two calculated values.
     */
    _scaleToMin: function(scalar, minScalar, proportion, constant) {
        var scalarProportionDelta = (scalar - minScalar) * proportion;
        var scalarDifferenceDelta = Math.max(constant, minScalar - constant);
        var scalarDelta = Math.max(scalarProportionDelta, scalarDifferenceDelta);

        return scalarDelta;
    },

    /*
     * Incrementally zoom in or out and pan the view so that it never looses the point where click happened
     * this function is a modified d3's own zoom behavior on double click
     * for the original code see https://github.com/mbostock/d3/blob/master/src/behavior/zoom.js
     * function dblclicked() and what it refers to
     */
    zoomByIncrement: function(direction, duration) {
        var _this = this.context;

        var ratio = this.zoomer.scale();
        var pan = [this.zoomer.translate()[0], this.zoomer.translate()[1]];

        var mouse = d3.mouse(_this.element.node());
        var k = Math.log(ratio) / Math.LN2;

        //change factor direction based on the input. default is no direction supplied
        if(direction=="plus" || !direction) k = Math.floor(k) + 1;
        if(direction=="minus") k = Math.ceil(k) - 1;

        //decode panning
        var locus = [(mouse[0] - pan[0]) / ratio, (mouse[1] - pan[1]) / ratio];

        //recalculate zoom ratio
        var scaleExtent = this.zoomer.scaleExtent();
        if(ratio == scaleExtent[0]) {
            this.zoomer.ratioY = 1;
            this.zoomer.ratioX = 1;
        }
        ratio = Math.max(scaleExtent[0], Math.min( scaleExtent[1], Math.pow(2, k) ));

        //recalculate panning
        locus = [locus[0] * ratio + pan[0], locus[1] * ratio + pan[1]];
        pan[0] += mouse[0] - locus[0];
        pan[1] += mouse[1] - locus[1];

        //save changes to the zoom behavior and run the event
        this.zoomer.scale(ratio);
        this.zoomer.translate([pan[0], pan[1]]);
        this.zoomer.duration = duration||0;
        this.zoomer.event(_this.element);
    },


    /*
     * Reset zoom values without triggering a zoom event.
     */
     resetZoomState: function(element) {
        this.zoomer.scale(1);
        this.zoomer.ratioY = 1;
        this.zoomer.ratioX = 1;
        this.zoomer.translate([0, 0]);
    },

    reset: function(element, duration) {
        var _this = this.context;
        _this.isCanvasPreviouslyExpanded = false;

        this.zoomer.scale(1);
        this.zoomer.ratioY = 1;
        this.zoomer.ratioX = 1;
        this.zoomer.translate([0, 0]);
        this.zoomer.duration = duration||0;
        this.zoomer.event(element || _this.element);
    },

    rerun: function(element) {
        var _this = this.context;
        this.zoomer.event(element || _this.element);
    }
});
