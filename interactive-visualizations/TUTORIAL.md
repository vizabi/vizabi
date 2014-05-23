How to create a Gapminder visualization
---------------------------------------

## Baby steps

The very first thing you have to do is opening `base.js` and saving it as 'yourvizname.js'. Remember, we create visualizations by [extending the `base.js` template](README.md). Next, edit the [require-config.js](../require-config.js), adding the visualization to the path. It should be named 'vizabi.visualizations.yourvizname' and it should be added under the comment `// Interactive Visualizations`. The code should look like:

```javascript
// Interactive Visualizations
'vizabi.visualizations.bubble-chart': 'interactive-visualizations/bubble-chart/bubble-chart',
'vizabi.visualizations.income-mountain': 'interactive-visualizations/income-mountain/income-mountain',
'vizabi.visualizations.yourvizname': 'interactive-visualizations/yourvizname/youtvizname',
```

## Setting the visualization properties

The visualization you're creating should express its `state`. The state object is of extreme importance and should control all aspects of the visualization. Therefore, this should essentially be the first thing you set: what is the state, what are the properties, and how do they translate into properties. This will guide the whole implementation of event binding, data loading and widgets.

## Loading up any tools/widgets

To add a widget or a tool, include them into the module dependencies. This is done at the top of the script:

```javascript
define([
    'vizabi.tools.TOOL',
    'vizabi.widgets.WIDGET'
], function(Tool, Widget) {
     
});
```

Next, initialize them inside `tools` or `widgets` object:

```javascript
this.tools = {
    tool1: new Tool({ /* properties */ })
};

this.widgets = {
    widget1: new Widget(this, { /* properties })
}
```

Ok, so now you have initialized them! The initialization part of your viz is done. Next, we move on to the part where we makes things work.

## Start

### Starting the widgets

Now you have to start the widgets. You do it under the function `start` of the sandbox:

```javascript
yourvizname.prototype = {
    start: function() {
        // initialize the widget
        this.widgets.widget1.start();
    }
    ...
}
```

### Setting up layout rules

The layout manager needs a layout so it can operate on the visualization. You set it in the start function. The Layout Manager needs a special type of object, a RectBox object, which is discussed [here](../base/svg/). It's very simple, and you shouldn't worry much about it. Just make sure you understand what the Layout Manager does and what it needs.

```javascript
yourvizname.prototype = {
    start: function() {
        // initialize the widget
        this.widgets.widget1.start();

        // RectBoxes alias for Layout Manager
        var widgetRectBox = new RectBox(this.widgets.widget1.getGroup);
        // Layout positioning for the layout manager
        this.layout = {
            desktop: {
                widget1: {
                    render: this.widgets.widget1.render,
                    rectBox: widgetRectBox,
                    top: 50,
                    bottom: 100,
                    left: 50,
                    right: 80
                }
            }
        };

        // Set the layout
        this.setLayout(this.layout);
    }
    ...
}
```

### Binding events

We are almost done. As stated in Vizabi's [visualization guidelines](README.md), Gapminder's visualizations are responsive to events. In the start function, you have to bind actions to events.

```javascript
yourvizname.prototype = {
    start: function() {
        // initialize the widget
        this.widgets.widget1.start();

        // RectBoxes alias for Layout Manager
        var widgetRectBox = new RectBox(this.widgets.widget1.getGroup);
        // Layout positioning for the layout manager
        this.layout = {
            desktop: {
                widget1: {
                    render: this.widgets.widget1.render,
                    rectBox: widgetRectBox,
                    top: 50,
                    bottom: 100,
                    left: 50,
                    right: 80
                }
            }
        };

        // Set the layout
        this.setLayout(this.layout);

        // For use in the anonymous functions, if you're using them
        var _this = this;

        this.instances.events.bind('change:state', function(state) {
            // do the action for when the state changed
        });

        this.instances.events.bind('change:language', function(lang) {
            // do the action for when the language changed
        });

        this.instances.events.bind('resize', function() {
            _this.instances.layout.update();
        });

        // Run the layout manager for the first time
        this.instances.layout.update();

        return this;
    }
    ...
}
```

Now you're done. You have to edit the other functions, such as `stop`, `destroy`, etc., to do what they have to do. This changes from visualization to visualization, so it is kinda pointless trying to generalize. A minor attempt to cover some common ground is already included in `base.js`.

### Example implementation

Check [this implementation](template.js), which also includes an example on how to load data into the visualization.