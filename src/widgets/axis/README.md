Axis Widget
-----------

# Construction

```javascript
var axis = new Axis(sandbox, scale[, options])
```
`sandbox` is the sandbox  
`scale` is a d3 scale (see Vizabi/tools/scale)  
`options` is an object used to supply axis options (see Properties below)

# Properties

The default properties for the Axis widget are the following:
```javascript
{
    orientation: 'bottom'
    values: undefined
    tickFormat: undefined
    cssClass: undefined
}
```

`orientation` is the orientation of ticks; it controls where the value labels are supposed to be shown in relation to the axis. Acceptable values are `bottom`, `top`, `left` and `right`. `top`, for example, would show the labels above the axis `values` is an array of pre-determined labels to be shown by the axis. If left blank (undefined), the list of labels will be set by d3  
`tickFormat` is a function for customizing the labels  
`cssClass` is the css class selector to be associated with the axis  

# Example

```javascript
define([
    'vizabi.widgets.axis',
    'vizabi.tools.scale'
], function(Axis, Scale) {
    // assume a sandbox is defined...
    var scale = new Scale({ valueEnd: 10, rangeEnd: 10 });
    var axis = new Axis(sandbox, scale);
    axis.start(); // add an axis with values ranging from 0 to 10
})
```
