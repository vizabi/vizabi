define([
    'base/object',
    'base/rectBox'
], function(object, rectBox) {
    var extend = object.extend;

    var register = function(parentInstance, childInstance) {
        parentInstance.instances.push(childInstance);
        return parentInstance.instances;
    };

    var calculateStage = function(context) {
        var currentWidth = context.properties.currentMeasures.width;
        var currentHeight = context.properties.currentMeasures.height;
        
        var defaultWidth = context.properties.defaultMeasures.width;
        var defaultHeight = context.properties.defaultMeasures.height;

        var stage = {
            width: defaultWidth,
            height: defaultHeight
        };

        var newAspectRatio = currentWidth / currentHeight;
        var defaultAspectRatio = defaultWidth / defaultHeight;

        if (newAspectRatio < defaultAspectRatio) {
            stage.height = stage.width / newAspectRatio;
        } else if (newAspectRatio > defaultAspectRatio) {
            stage.width = stage.height * newAspectRatio;
        }

        context.setProperties({ stage: stage });

        return stage;
    };

    var setCurrentMeasures = function(context) {
        var div = context.properties.div;   // d3 object

        var boundingRect = div.node().getBoundingClientRect();

        var currentMeasures = {
            width: boundingRect.width,
            height: boundingRect.height
        };

        context.setProperties({ currentMeasures: currentMeasures });

        return currentMeasures;
    };

    var setSvgViewBox = function(context) {
        var svg = context.properties.svg;
        var stage = context.properties.stage;

        svg.attr('viewBox', '0 0 ' + stage.width + ' ' + stage.height);
        svg.attr('preserveAspectRatio', 'xMinYMin meet');

        return svg;
    };

    var setSvgMeasures = function(context) {
        var currentMeasures = context.properties.currentMeasures;
        var svg = context.properties.svg;

        svg.attr('width', currentMeasures.width);
        svg.attr('height', currentMeasures.height);
    };

    var processItem = function(item, context) {
        var layout = item.layout;
        var schema = item.schema;
        var item = item.item;
        var anchors = Object.keys(layout[schema][item]);

        for (var i = 0; i < anchors.length; i++) {
            // Skip reserved properties
            switch(anchors[i]) { 
                case 'element':
                case 'render':
                    continue;
            }

            var point = layout[schema][item][anchors[i]];

            if (typeof point === 'object') {
                var linkedAnchor;
                if (point.parent !== 'stage') {
                    linkedAnchor = layout[schema][point.parent][point.anchor];
                } else {
                    linkedAnchor = context.properties.stage[point.anchor];
                }

                if (point.padding) linkedAnchor += point.padding;
                if (point.percentage) linkedAnchor *= (point.percentage / 100);

                // replace object with calculated value
                layout[schema][item][anchors[i]] = linkedAnchor;
            } else if (typeof point !== 'number') {
                layout[schema][item][anchors[i]] = Number(point);
            }
        }

        return layout[schema][item];
    };

    var fillHeightWidth = function(item) {
        // 'rectbox' a function/object instead of a plain d3 object!
        var rectBox = new RectBox(item.element);
        item.height = rectBox.getHeight();
        item.width = rectBox.getWidth();
    };

    var arrange = function(item) {
        if (item.xcenter) {
            item.left = item.xcenter - (item.width / 2);
            item.right = item.left + item.width;
        } else {
            if (item.left) {
                if (!item.right) {
                    item.right = item.left + item.width;
                }
            } else {
                if (item.right) {
                    item.left = item.right - item.width;
                } else {
                    item.left = 0;
                    item.right = item.width;
                }
            }

            item.xcenter = item.left + (item.width / 2);
        }

        if (item.ycenter) {
            item.top = item.ycenter - (item.height / 2);
            item.bottom = item.top + item.height;
        } else {
            if (item.top) {
                if (!item.bottom) {
                    item.bottom = item.top + item.height;
                }
            } else {
                if (item.bottom) {
                    item.top = item.bottom - item.height;
                } else {
                    item.top = 0;
                    item.bottom = item.height;
                }
            }

            item.ycenter = item.top + (item.height / 2);
        }
    };

    var place = function(item) {
        var rectBox = new RectBox(item.element);
        rectBox.move(item.left, item.top);
    };

    var triggerRender = function(item) {
        var horizontal = item.right - item.left;
        var vertical = item.bottom - item.top;

        // If horizontal/vertical === NaN, its is still ok to go through:
        // it means that the item does not rely on horizontal/vertical to draw
        // itself on the stage.
        if (item.render) item.render(horizontal, vertical);
    };

    var position = function(context) {
        var layout = context.get();
        var schema = context.getProperties().schema;
        var item = Object.keys(layout[schema]);
        var newAnchor = {};

        for (var i = 0; i < item.length; i++) {

            newAnchor[item[i]] = processItem({
                layout: layout,
                schema: schema,
                item: item[i]
            }, context);

            triggerRender(layout[schema][item[i]]);
            fillHeightWidth(layout[schema][item[i]]);
            arrange(newAnchor[item[i]]);
            place(layout[schema][item[i]]);
        }
    };

    var update = function(context) {
        setCurrentMeasures(context);
        calculateStage(context);
        setSvgMeasures(context);
        setSvgViewBox(context);
        position(context);
    };

    var layoutManagerSingleton = {
        instances: [],

        updateAll: function() {
            for (var i = 0; i < this.instances.length; i++) {
                this.instances[i].update();
            }
        },

        instance: function() {
            var instance = {
                layout: {},

                properties: {
                    // for now, a d3 object
                    svg: undefined,
                    // for now, a d3 object
                    div: undefined,
                    // array with default width/height
                    defaultMeasures: { width: 900, height: 500 },
                    // array with current width/height
                    currentMeasures: { width: 900, height: 500 },
                    // the stage and its measures
                    stage: undefined,
                    // currently selected schema for updating
                    schema: undefined,
                },

                set: function(layout) {
                    this.layout = layout;
                },

                get: function() {
                    return extend({}, this.layout);
                },

                clear: function() {
                    this.layout = {};
                },

                add: function(layout) {
                    extend(this.layout, layout);
                },

                setProperties: function(properties) {
                    extend(this.properties, properties);
                },

                getProperties: function() {
                    return extend({}, this.properties);
                },

                update: function() {
                    update(this);
                }
            };

            register(this, instance);

            return instance;
        }
    };

    return layoutManagerSingleton;
});
