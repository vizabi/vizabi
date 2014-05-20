Rectangle Widget
----------------

This widget draws rectangles from data, using vertical and horizontal scales.

# Construction
```javascript
var rect = new Rectangle(sandbox[, options, verticalScale, horizontalScale])
```
`sandbox` is the sandbox  
`options` are the properties as listed below
`verticalScale` is the optional scale used to calculate vertical positioning
`horizontalScale` is the optional horizontal scale

# Properties
```javascript
{
    widthThickness: 20,
    heightThickness: 20,
    cssClass: undefined
}
```

`widthThickness` the horizontal thickness of the rectangle. This is used for vertical rectangles  
`heightThickness` is the vertical thickness of a rectangle. This is used for horizontal rectangles  
`cssClass` is the css class for the Rectangles's svg group

# Example
```javascript
define([
    'vizabi.widgets.rectangle'
], function(Rectangle) {
    // assume a sandbox is defined
    var rect = new Rectangle(sandbox, {
        widthThickness: 50,
        heightThickness: 50
    });

    rect.setData(data);

    rect.start();
});
```
