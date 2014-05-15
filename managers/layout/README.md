# Layout Manager The Layout Manager is a module that controls the positioning
of `svg:group` elements inside an `svg`. It becomes aware of the size of a
`svg:group` rectangle and uses that information to place objects inside the
`svg`. The Layout Manager operates aiming to enable responsive layouts for all
different aspect-ratios of a visualization across different screen
resolutions.

## Should I use it?
Yes! This is a requirement for all visualizations at Gapminder.

---

## How does the Layout Manager work

The Layout Manager operates in a SVG context, determining the positioning and
size (height/width) of the `svg:group` rectangle boxes. It provides some
interesting features as the positioning of a box in relation to other boxes.
The manager has it's own 'vocabulary' for expressing such behavior and can be
configured to run every time a screen is resized.  

To understand the Layout Manager you have to think of a SVG visualization as a
group of components, each with its `svg:group` rectangle. The Layout Manager
is responsible for calculating the dimensions of the rectangle. After the
dimensions are set, the components are initially drawn at (0,0).  

The next step is quite simple: just position the rectangle boxes following a
set of rules. To avoid problems, always think of the arrangement of the rules
in a sequential manner. For that effect, something along the lines of "I will
first position component A. Then I will position component B in relation to
component A. Next, I will position component C in relation to component B" is
plausible. Avoid referencing components out-of-order.  

```javascript
{
    schema: {
        rectangleA: {   // black
            top: 10,
            bottom: 60,
            left: 10,
            right: 60
        },
        rectangleB: {   // blue
            top: { parent: 'rectangleA', anchor: 'top' },
            bottom: { parent: 'rectangleA', anchor: 'bottom' },
            left: { parent: 'rectangleA', anchor: 'right', padding: 5 },
            right: { parent: 'rectangleA', anchor: 'right', padding: 70 }
        },
        rectangleC: {   // red
            top: { parent: 'rectangleB', anchor: 'top' },
            bottom: { parent: 'rectangleB', anchor: 'bottom' },
            left: { parent: 'rectangleB', anchor: 'right', padding: 20 },
            right: { parent: 'rectangleB', anchor: 'right', padding: 70 }
        }
    }
}
```

You can read the rules like this:

+ rectangleA
   - positioned at left: 10, right: 60, top: 10, bottom: 60

+ rectangleB 
   - `left` is positioned to the right of rectangleA, plus 5
   - `right` is positioned to the right of Rectangle A, plus 70
   - `top` is positioned as the top of rectangleA
   - `bottom` is positioned as the bottom of rectangleA

+ rectangleC
   - `left` is positioned to the right of Rectangle B, plus 20
   - `right` is positioned to the right of Rectangle B, plus 70
   - `top` is positioned as the top of Rectangle B
   - `bottom` is positioned as the bottom of Rectangle B

The resulting svg is as below:

![](http://oi59.tinypic.com/epkxp5.jpg)

Now lets place rectangle C below rectangle B

```javascript
// The new code for rectangleC would be
{
    rectangleC: {
        top: { parent: 'rectangleB', anchor: 'bottom' },
        bottom: { parent: 'rectangleB', anchor: 'bottom', padding: 60 },
        left: { parent: 'rectangleB', anchor: 'left' },
        right: { parent: 'rectangleB', anchor: 'right' }
    }
}
```

Which results in:

![](http://oi58.tinypic.com/123w68l.jpg)

## Can't I just set it by hand?

When the SVG is resized, the dimensions and positioning of the boxes get all
screwed up. To prevent the developer from wasting his time calculating the new
size of the rectangles, the Layout Manager will do this for him automatically.

---

## Including the Layout Manager
```javascript
define(['vizabi.managers.layout'], function(LayoutManager) {
    // your code here
    var layoutManager = LayoutManager.instance();
});
```

---

## Objects
```javascript
layoutManager.layout
```

```javascript
layoutManager.properties
```

List of properties used
```javascript
{
    svg: undefined,      // for now, a d3 object
    div: undefined,      // for now, a d3 object
    defaultMeasures: {
        width: 900,      // default viz width
        height: 500      // default viz height
    },
    currentMeasures: {
        width: 900,      // current viz width (dynamic)
        height: 500      // current viz height (dynamic)
    },
    stage: undefined,    // the stage and its measures
    schema: undefined    // currently selected schema for update rules
}
```

---

## Methods
```javascript
LayoutManager.instance()
```

Returns a working instance of the Global Layout Manager.  

For the methods listed below, let `layoutManager = LayoutManager.instance()`.

```javascript
layoutManager.set(layout)
```
`layout` The layout rules to be set.

```javascript
layoutManager.get()
```

Returns the current layout rules.

```javascript
layoutManager.clear()
```

Erases the layout rules by assigning the layout to an empty object.

```javascript
layoutManager.add(layout)
```

`layout` A subset of layout rules.  

Extends the current layout rules with a new rule.

```javascript
layoutManager.setProperties(properties)
```

`properties` An object containing a new set of properties for the Layout Manager.  

The current properties of the Layout Manager are extended with the new set of properties.

```javascript
layoutManager.getProperties()
```

Returns a copy of the current properties.

```javascript
layoutManager.update()
```

Updates the rectangle boxes throughout the visualization, using the current
`schema` as the rule to be followed.

---

## Vocabulary

There are certain words that are reserved apart from 'top', 'bottom', 'left',
'right', 'xcenter' and 'ycenter'. We list this words below, with an example.

```
rectBox
```

The *rectBox* is a module that provides the LayoutManager functionality to
calculate the width and height of svg groups. It is described under
`vizabi/base/svg/rectBox`.

```javascript
// Each SVG widget has a `getGroup` function, which returns its SVG container
schema: {
    widget: {
        rectBox: new RectBox(widget.getGroup())
    }
}
```

---

```
render
```

Certain visualization widget are susceptible to the size determined by the
Layout Manager (eg. axes, chart areas). They need to be rendered after the
Layout Manager has calculated the width/height of the rectangle where the
widget is drawn.  

The way the Layout Manager communicates this to the widget is by evoking a
function called `render`, which is defined for every widget that needs to be
're-drawn'.  

It is very important to bind the render function of widgets to their
respective widgets, otherwise `this` will refer to the LayoutManager and not
the widget in the render function, as expected.

```javascript
// Pass the reference to the render function
schema: {
    widget: {
        render: widget.render
    }
}
```

---

#### The 6 positioning elements

```
top, bottom, left, right
```

These are very intuitive. Sets the boundaries of the rectangle to whatever
value (or related box) you set.

```
xcenter, ycenter
```

The `xcenter` and `ycenter` are used for aligning the widget horizontally or
vertically with a certain value (or related box). These elements are available
for use to objects that are not dependent on the calculation of the entire
rectangle to render themselves.

Setting xcenter overrides 'left' and 'right', while setting ycenter overrides
'top' and 'bottom'. The positioning of rectangles is dictated by 'xcenter' and
width or 'ycenter' and height of the rectangles.

##### Their properties

```
padding
```

* Acceptable value: Number

Adds the value of padding to the positioning element.

<!-- ```
percentage
```

* Acceptable value: String, Number

The percentage property takes values as strings in the form of "x.y%" or a Number. The size  -->

```
parent
```

* Acceptable value: String

The name of the widget which is to be referenced. The widget name follows the
name that was given in the set of rules for the Layout Manager.

```
anchor
```

What positioning element is referenced from parent.

###### Special case: The 'Stage'

To reference the entire SVG container, we called it the `stage`. The stage
represents the measurements of the SVG. One can reference two special anchors
from stage: `height`, which is the entire height of the SVG; and `width`,
which is the entire width of the SVG.  

The stage is useful for placing objects in relation to the measurements of the
SVG. For example, if one wants to position a rectangle with its bottom being
the bottom of the SVG container, a rule would read:

```javascript
widget: {
    bottom: {
        parent: 'stage',
        anchor: 'height'
    }
}
```

---

## Usage
```javascript
define([
    'd3',
    'vizabi.managers.layout'
], function(d3, LayoutManager) {
    // Set up div and SVG d3 objects
    var container = d3.select('body').append('div')
        .attr('id', 'container');
    var svg = container.append('svg');
 
    // get the instance instance
    var layoutManager = LayoutManager.instance();

    // Set up the Layout Manager properties
    layoutManager.setProperties({
        div: container,      // d3 object
        svg: svg,            // d3 object
        schema: 'example',
        defaultMeasures: {
            width: 900,
            height: 500
        }
    });

    // Describe the layout rules
    var layoutRules = {
        example: {
            componentx: {
                ...
            }
        }
    };

    // Set the rules
    layoutManager.set(layoutRules);

    // Update the positioning
    layoutManager.update();

    // If you choose to, bind it to the window 'resize' event
    window.addListener('resize', function() {
        layoutManager.update();
    });
});
```
