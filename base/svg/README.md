Base SVG helpers

# rectBox.js
---

The rectBox is a helper that provides the functionality of calculating the
width and height of `svg:group` elements, as well as moving them using the
*translate* transformation.

## Construction

```javascript
define(['vizabi.object.rectBox'], function(RectBox) {
    // assume W is a widget
    var svgGroup = W.getGroup();
    var rectBox = new RectBox(svgGroup);
});
```

## Methods

```javascript
rectBox.getHeight()
```

_Return_ The bounding rectangle height.

```javascript
rectBox.getWidth()
```

_Return_ The bounding rectangle width.

```javascript
rectBox.move(top, left)
```

`top` The y position to move the rectangle to  
`left` The x position to move the rectangle to  

Uses `transform:translate(x,y)` to move the group element.