Scales
------

# Construction

```javascript
define([
    'vizabi.tools.scale'
], function(Scale) {
    var scale = new Scale(properties);
});
```

# Properties

```javascript
{
    type: 'linear',
    valueStart: 0,
    valueEnd: 0,
    rangeStart: 0,
    rangeEnd: 0
}
```

`type` is the d3 scale type of the scale to be constructed  
`valueStart` and `valueEnd` provide the domain of the scale  
`rangeStart` and `rangeEnd` provide the range of the scale  

# Example
```javascript
define([
    'vizabi.tools.scale'
], function(Scale) {
    // creates a scale from 0-10
    var scale = new Scale({ valueEnd: 10, rangeEnd: 10});
});
```
