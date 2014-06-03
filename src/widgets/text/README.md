Text Widget
-----------

# Construction

```javascript
var text = new TextWidget(sandbox, properties)
```

`sandbox` is the sandbox  
`properties` are the properties as listed below

# Properties
```javascript
{
    text: 'text',
    cssClass: undefined
}
```

`text` is the text to be displayed  
`cssClass` is the css class for the Text's svg group

# Example
```javascript
define([
    'vizabi.widgets.text'
], function(TextWidget) { // dont use 'Text'
    // assume a sandbox already exists
    var text = new TextWidget(sandbox, {
        text: 'test',
        cssClass: 'text'
    });
});
```
