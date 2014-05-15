# Events manager

The Events Manager is a singleton from which you can obtain instances. The singleton object manages the events, which are custom events triggered by functions and _not_ the *DOM Events* API. These events are used by our visualization controllers.

The visualization is responsive to the events that occur in its domain, such as a change to a state, a change of language, and several more. Each visualization has its own set of events, which are triggered upon interaction.

## Should I use it?
Yes! This is required for all Gapminder visualizations.

## Including the module
```javascript
define([
    'vizabi.managers.events'
], function(EventsManager) {
    var eventsManager = EventsManager.instance();
});
```

## Methods
### The Events Manager instance
```javascript
var eventsManager = eventsManager.instance()
```
To properly use the Events Manager, you have to call the `instance()` function, that will return an instance of the Events Manager. This instance has several functions, which are described in this section, that allow you to operate correctly with the events. Think of the instance as a 'child' of the Events Manager singleton.

### The events object
```javascript
eventsManager.events
```

This object contains all the information about the events instantiated by this instance of the Events Manager.

```json
{
    "change:state": [
        ~function reference~,
        ~function reference~
    ],
    "change:language": [
        ~function reference~
    ],
    ...
}
```

### Triggering an event
```javascript
eventsManager.trigger(name[, args])
```
`name` The name of the event to trigger.  
`args` Arguments to be passed to the functions associated with the event `name`.


### Binding to an event
```javascript
eventsManager.bind(name, func)
```
`name` The name of the event to listen.  
`func` Function to be called when event `name` is triggered.

### Unbinding an event
```javascript
eventsManager.unbind(name, func)
```
`name` Name of the event to unbind.  
`func` Function reference to dissociate from the array of function references.

### Unbinding all events
```javascript
eventsManager.unbindAll()
```
Clears all existing events in this instance of the Events Manager.

## Example
```javascript
define(['events-manager'], function(eventsManager) {
    var events = eventsManager.instance();

    events.bind('test', function(num, num2) {
        console.log('TESTING', num, num2);
    }

    events.trigger('test', 5, 6); // prints 'TESTING 5 6'
});
```