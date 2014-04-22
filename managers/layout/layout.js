// Layout Manager.js
// =================
// The Layout Manager manages UI positioning, visibility and triggers rendering
// of UI components for Gapminder's visualizations.
//
// ```svg``` svg d3 element
//
// ```defaultMeasures``` default visualization width and height
//
// ```currentMeasures``` current width and height on display
// function layoutManager(svg, defaultMeasures, currentMeasures) {
define([],
    function() {
        'use strict';

        var svg;
        var defaultMeasures;
        var currentMeasures;

        var stage = {
            width: 0,
            height: 0
        };

        var layout = {};

        var selectedLayoutName;

        var errorMsg = {
            // Parameter elements error
            missingSVG: 'Layout Manager needs the svg element!',
            missingMeasures: 'Layout Manager needs to know the viz default and' +
                'current measures (width / height).',
            malformedMeasureObj: 'Object needs width and height attributes.',

            // Layout specific error
            missingLayoutName: 'Layout name must be a string!',
            duplicateLayoutName: 'Already exists a layout with that name!',
            invalidLayoutName: 'Invalid layout specified',
            invalidComponentType: 'Component should be added as an object',
            invalidLayoutNameToSelect: 'Layout does not exist!',
            noLayoutAdded: 'Please add a layout!',

            // Component errors
            noComponentId: 'Please specify the id attribute in the component obj',

            // Anchor point processing
            unknownComponentName: 'Unknown component',
            unknownAnchorPointName: 'Unknown anchor point',
            badAnchorPoint: 'Invalid anchor point'
        };

        function init(s, d, c) {
            // Checks for SVG element. We need it to control and listen for
            // size changes (either fullscreen or just div width/height).
            if (!s) {
                console.error(errorMsg.missingSVG, svg);
                return false;
            }

            svg = s;
            defaultMeasures = d;
            currentMeasures = c;

            validateMeasureObjects();
        }

        // Validates the measure objects
        function validateMeasureObjects() {
            if (!defaultMeasures || !currentMeasures) {
                console.error(errorMsg.missingElements,
                    'defaultMeasures:', defaultMeasures,
                    'currentMeasures:', currentMeasures);
                return false;
            }

            if (!defaultMeasures.height || !defaultMeasures.width) {
                console.error('defaultMeasures:', errorMsg.malformedMeasureObj,
                    defaultMeasures);
                return false;
            }

            if (!currentMeasures.height || !currentMeasures.width) {
                console.error('currentMeasures:', errorMsg.malformedMeasureObj,
                    currentMeasures);
                return false;
            }
        }

        // Updates the SVG Measures
        function updateSVGMeasures() {
            svg.attr('width', currentMeasures.width);
            svg.attr('height', currentMeasures.height);
        }

        // Calculates the new viewBox measures for the visualization. Implicit in
        // this calculation is what it means for the visualization: it will either
        // stretch the width or height of the canvas so the new aspect ratio is
        // achieved based on the default configuration of (width, height) of the
        // visualization.
        //
        // We want to always stretch and never shrink the canvas, which implies that
        // either the width or the height will change. That is based on the aspect
        // ratio of the new canvas.
        //
        // This function returns the viewBox measurements for the visualization
        // using the new canvas taking into account the new aspect ratio.
        function calculateNewViewBox() {
            var newAspectRatio = currentMeasures.width / currentMeasures.height;
            var defaultAspectRatio = defaultMeasures.width / defaultMeasures.height;

            stage.width = defaultMeasures.width;
            stage.height = defaultMeasures.height;

            if (newAspectRatio < defaultAspectRatio) {
                stage.height = stage.width / newAspectRatio;
            } else if (newAspectRatio > defaultAspectRatio) {
                stage.width = stage.height * newAspectRatio;
            }

            return stage;
        }

        // Sets the SVG viewBox attribute to the new viewBox.
        function setSVGViewBox() {
            svg.attr('viewBox', '0 0 ' +
                stage.width + ' ' + stage.height);
            svg.attr('preserveAspectRatio', 'xMinYMin meet');
        }

        // Sets the current measures attributes based on clientWidth/clientHeight.
        // This is to solve when the width/height is expressed as '100%'.
        function parseCurrentMeasures() {
            currentMeasures.width = svg.property('clientWidth');
            currentMeasures.height = svg.property('clientHeight');
        }

        // Creates a new layout configuration.
        function addLayout(layoutName) {
            if (typeof layoutName === 'string') {
                if (!layout[layoutName]) {
                    layout[layoutName] = {};
                    // Add stage as a component, to refuse injections of stage and
                    // make it accessible without the need to get the stage object
                    layout[layoutName].stage = stage;
                    // Selects the layout if it is the first one
                    if (!selectedLayoutName) {
                        changeSelectedLayout(layoutName);
                    }
                } else {
                    console.error(errorMsg.duplicateLayoutName);
                    return false;
                }
            } else {
                console.error(errorMsg.missingLayoutName);
                return false;
            }
        }

        // Adds a visualization component to an specific layout.
        function addComponent(layoutName, componentObj) {
            if (!layout[layoutName]) {
                console.error(errorMsg.invalidLayoutName, layoutName);
                return false;
            }

            if (typeof componentObj === 'object') {
                if (!componentObj.id) {
                    console.error(errorMsg.noComponentId, componentObj);
                    return false;
                }
                layout[layoutName][componentObj.id] = componentObj;
            } else {
                console.error(errorMsg.invalidComponentType);
                return false;
            }
        }

        // Changes the current layout to newSelectedLayoutName
        function changeSelectedLayout(newSelectedLayoutName) {
            if (layout[newSelectedLayoutName]) {
                selectedLayoutName = newSelectedLayoutName;
            } else {
                console.error(newSelectedLayoutName,
                    errorMsg.invalidLayoutNameToSelect);
                return false;
            }
        }

        // Gets the width of the component
        function getWidth(component) {
            if (!component.width) {
                return component.g.node().getBBox().width;
            }

            return component.width;
        }

        // Gets the height of the component
        function getHeight(component) {
            if (!component.height) {
                return component.g.node().getBBox().height;
            }

            return component.height;
        }

        // Parses a percentage value and returns it's corresponding value as a
        // number. The percentage value is applied to the measure.
        function parsePercentage(anchorPoint, measure) {
            var p = +(anchorPoint.slice(0, anchorPoint.indexOf('%')));
            return p / 100 * measure;
        }

        // Parses a pixel value and returns it's corresponding value as a number.
        function parsePixels(anchorPoint) {
            var p = +(anchorPoint.slice(0, anchorPoint.indexOf('px')));
            return p;
        }

        // Returns the linked component's requested anchor point
        function getAnchorPoint(componentName, anchorPointName) {
            // Sanity check on anchor point
            if (anchorPointName !== 'left' && anchorPointName !== 'right' &&
                anchorPointName !== 'top' && anchorPointName !== 'bottom' &&
                anchorPointName !== 'xcenter' && anchorPointName !== 'ycenter' &&
                anchorPointName !== 'width' && anchorPointName !== 'height') {
                console.error(errorMsg.unknownAnchorPointName, anchorPointName);
                return undefined;
            }

            // Sanity check on the component
            if (!layout[selectedLayoutName][componentName]) {
                console.error(errorMsg.unknownComponentName, componentName);
                return undefined;
            }

            var component = layout[selectedLayoutName][componentName];
            var anchorPoints = processAnchorPoints(component);

            discoverAllPoints(anchorPoints);

            return anchorPoints[anchorPointName];
        }

        // Parses and returns the value for a linked anchor point. If padding is
        // specified, it is applied to the returned value.
        function parseLinkedAnchorPoint(anchorPoint) {
            var bind = anchorPoint[0].split('.');
            var padding = anchorPoint[1] ? anchorPoint[1].padding : undefined;
            var percentage = anchorPoint[1] ? anchorPoint[1].percentage : undefined;

            var componentName = bind[0];
            var anchorPointName = bind[1];

            var point = getAnchorPoint(componentName, anchorPointName);

            if (percentage) {
                point = parsePercentage(percentage, point);
            }

            if (padding) {
                point += padding;
            }

            return point;
        }

        // Treats all types of anchor points. Here, the anchor point is broken down
        // by type and processed. Acceptable anchor points are percentages (string),
        // pixels (string), array (object) and numbers. If an anchor point does not
        // exist for the component, undefined is returned.
        function parseAnchorPoint(anchorPoint, viewBoxMeasure) {
            if (typeof anchorPoint === 'string') {
                if (isNaN(+anchorPoint)) {
                    if (anchorPoint.indexOf('%') !== -1) {
                        return parsePercentage(anchorPoint, viewBoxMeasure);
                    } else if (anchorPoint.indexOf('px') !== -1) {
                        return parsePixels(anchorPoint);
                    } else {
                        console.error(errorMsg.badAnchorPointStr, anchorPoint);
                        return 0; // What to return? Error and value?
                    }
                } else {
                    return +anchorPoint;
                }
            } else if (typeof anchorPoint === 'object') {
                return parseLinkedAnchorPoint(anchorPoint);
            } else if (typeof anchorPoint === 'number') {
                return anchorPoint;
            } else if (typeof anchorPoint === 'undefined') {
                return undefined;
            } else {
                console.error(errorMsg.badAnchorPoint, anchorPoint);
                return undefined;
            }
        }

        // Returns an object with a copy of the anchor points of the component
        function processAnchorPoints(component) {
            return {
                left: parseAnchorPoint(component.left, stage.width),
                right: parseAnchorPoint(component.right, stage.width),
                xcenter: parseAnchorPoint(component.xcenter, stage.width),
                top: parseAnchorPoint(component.top, stage.height),
                bottom: parseAnchorPoint(component.bottom, stage.height),
                ycenter: parseAnchorPoint(component.ycenter, stage.height),
                width: getWidth(component),
                height: getHeight(component)
            };
        }

        // Discovers all anchor points for a given component
        function discoverAllPoints(anchorPoints) {
            // Horizontal calculation
            if (!anchorPoints.left && anchorPoints.right) {
                anchorPoints.left = anchorPoints.right - anchorPoints.width;
            } else if (!anchorPoints.left && !anchorPoints.right) {
                // Blank the horizontal points
                anchorPoints.left = 0;
                anchorPoints.right = anchorPoints.width;
            } else if (anchorPoints.left && !anchorPoints.right) {
                anchorPoints.right = anchorPoints.left + anchorPoints.width;
            }

            // Check for horizontal centering
            if (anchorPoints.xcenter) {
                anchorPoints.left = anchorPoints.xcenter - anchorPoints.width / 2;
                anchorPoints.right = anchorPoints.xcenter + anchorPoints.width / 2;
            } else {
                anchorPoints.xcenter = anchorPoints.left + (anchorPoints.width / 2);
            }

            // Vertical calculation
            if (!anchorPoints.top && anchorPoints.bottom) {
                anchorPoints.top = anchorPoints.bottom - anchorPoints.height;
            } else if (!anchorPoints.top && !anchorPoints.bottom) {
                // Blank the vertical points
                anchorPoints.top = 0;
                anchorPoints.bottom = anchorPoints.height;
            } else if (anchorPoints.top && !anchorPoints.bottom) {
                anchorPoints.bottom = anchorPoints.top + anchorPoints.height;
            }

            if (anchorPoints.ycenter) {
                anchorPoints.top = anchorPoints.ycenter - (anchorPoints.height / 2);
                anchorPoints.bottom = anchorPoints.ycenter + anchorPoints.height / 2;
            } else {
                anchorPoints.ycenter = anchorPoints.top + (anchorPoints.height / 2);
            }

            return anchorPoints;
        }

        // Calculates the new position of a component's anchor points
        function calculateNewPosition(component) {
            var anchorPoints = processAnchorPoints(component);

            discoverAllPoints(anchorPoints);

            return anchorPoints;
        }

        // Positions the visualization components using their anchor points based on
        // the current viewBox measurements.
        function positionElements() {
            if (layout[selectedLayoutName]) {
                for (var comp in layout[selectedLayoutName]) {
                    if (layout[selectedLayoutName].hasOwnProperty(comp)) {
                        if (comp === 'stage') {
                            continue;
                        }

                        var component = layout[selectedLayoutName][comp];
                        var newPosition = calculateNewPosition(component);

                        if (component.render) {
                            var width = newPosition.right - newPosition.left;
                            var height = newPosition.bottom - newPosition.top;
                            var bbox = component.render(width, height);
                            component.width = bbox.width;
                            component.height = bbox.height;
                        }

                        component.g.attr('transform', 'translate(' +
                            newPosition.left + ',' + newPosition.top + ')');
                    }
                }
            } else {
                console.error(errorMsg.noLayoutAdded);
                return false;
            }
        }

        // Updates the canvas. Calls the calculation of the new aspect ratio and
        // fixes the position of UI components based on new canvas.
        function update() {
            validateMeasureObjects();
            parseCurrentMeasures();
            calculateNewViewBox();
            setSVGViewBox();
            positionElements();
        }

        function fullscreenResize() {
            // TODO:
            // Remove the 20 padding after checking why the svg is bigger
            // than the window size on Chrome (where does the default padding
            // comes from?)
            currentMeasures.width = window.innerWidth - 20;
            currentMeasures.height = window.innerHeight - 20;
            updateSVGMeasures();
            update();
        }

        // Listener for changes to the window (to be called when on fullscreen mode)
        function listenFullScreen() {
            fullscreenResize();

            window.addEventListener('resize', function () {
                fullscreenResize();
            });
        }

        function divResize() {
            parseCurrentMeasures();
            update();
        }

        function listenDiv() {
            divResize();

            window.addEventListener('resize', function () {
                divResize();
            });
        }

        return {
            init: init,
            addLayout: addLayout,
            addComponent: addComponent,
            changeSelectedLayout: changeSelectedLayout,
            update: update,
            fullscreenScale: listenFullScreen,
            divScale: listenDiv,
            stage: stage
        };
    }
// General ToDo'S
// ------
// * Find out if it's faster to use preserveAspectRatio or transform scale
);
