Creating a new visualization
----------------------------

# Architecture

[Soon](link).

# I want to create a new visualization

To make visualizations following our framework, we decided to provide a 'base' implementation, that you'd only have to extend. This base script contains all necessary information that our visualizations 'require' -- from certain objects named a certain way (i.e. state), to functions that must exist (i.e. setLanguage).

# Ok, so what do I need to know?

It's highly likely that you have checked out [d3.js](http://d3js.org). That's a very good start place if you haven't. :)  

To use our widgets, which are either abstractions of d3 functionality (axis, text) or small components (timeslider), see 'vizabi/widgets'. They are small modules that are going to be used by our visualization, and all you have to do is include them. Check their API for information on properties and functions. And, of course, expand or improve them if you want to! We are very welcome to meaningful additions to our project.

# Expanding the 'base' visualization

See 'vizabi/interactive-visualization/base.js'.  

To create new visualizations, it is best to start by expanding the base visualization script. It contains all necessary functions for a Gapminder visualization to exist. The methods and properties described in `base.js` are used to communicate to other tools that we have internally at Gapminder and they follow certain patterns (a property with a certain name, functions, etc).

Here, we describe various aspects of 'base'. This is not a tutorial on how to do a visualization. You can check that [here](TUTORIAL.md).

### Visualization properties

###### The State

The _state_ is the property that all visualizations carry and has every bit of information about the visualization itself. Think of the state as a 'freeze' condition: a state is unique and it replicates what is displayed by the visualization with its properties.

On `base.js`, it is very well defined:

```javascript
// The visualization *state*. This contains the properties of the
// visualization that is being displayed to the user.
this.state = {

};
```

And it's empty! Since every visualization has its own aspects, the state is unique. You should add whatever information is needed for the visualization to display whatever it is intended to display. While this sounds generic and maybe a little confusing, here's an example:

```javascript
// The visualization *state*. This contains the properties of the
// visualization that is being displayed to the user.
this.state = {
    year: 2014,
    geo: ['WORLD'],
    stack: false
};
```

Above you can see the state for the Income Mountain visualization. Combine this with the visualization and read it like: 'Show an Income Mountain, displaying data for the WORLD in 2014. Do not stack the data'.  

So, whatever the needs of your visualization, make sure they are expressed in the state.

###### Managers

See 'vizabi/managers/<manager>'.

There are, at this time, four managers for our visualizations: the Layout, Events, Data and i18n Managers. To read more about them, follow the directions given above.  

The managers are instantiated in 'base.js' from the start:

```javascript
// Manager instances, obtained from the core
this.instances = {
    events: core.getInstance('events'),
    data: core.getInstance('data'),
    layout: core.getInstance('layout'),
    i18n: core.getInstance('i18n')
};
```

As you can see, they are obtained from the core. Per Vizabi's architecture (see futurelink), a visualization is implemented as a sandbox and asks the core for functionality, such as managers.

Once you have instantiated the managers, you might have to set them up. The Layout Manager is the only one that pretty much needs some sort of property setting, and this is also included in 'base.js':

```javascript
// Sets up Managers
this.instances.layout.setProperties({
    div: this.container,    // d3 object
    svg: this.svg,          // d3 object
    schema: 'desktop',
    defaultMeasures: { width: 900, height: 500 }
});
```

This is just a basic setting, you should edit this if the need arises.  

Using the managers is pretty straight forward. As you have access to them under `this.instances`, all you have to do is make sure you have read their API to see what are the methods available to them.  

Here's an example, binding to state changes with the Events Manager:

```javascript
this.instances.events.bind('change:state', function(state) {
    console.log('Notification: state changed:', state);
})
```

Make sure you always change the state using the `setState` function, as it notifies the Events Manager of changes through the following code:

```javascript
setState: function(state) {
    extend(this.state, state);
    this.instances.events.trigger('change:state', this.state);
    return this;
}
```

### Initialization of tools and widgets

A visualization is composed of several widgets and tools. The tools are used by widgets to provide some sort of 'extra' functionality to them. A *scale* is a tools, which is used by the _axis_ widget.  

All of them must be initialized:

```javascript
// Tools for this visualization
this.tools = {

};

// Widgets that are used by the visualization.
this.widgets = {
    
};
```

Let's say you want to create an axis. For this, you will need a scale. Your setup could be in the lines of:

```javascript
define([
    'vizabi.tools.scale',
    'vizabi.widgets.axis',
    ...
], function(Scale, Axis, ...) {
    // ... other sandbox code ...

    this.tools = {
        horizontalScale: new Scale({
            // ... scale properties ...
        })
    }

    this.widgets = {
        axis: new Axis(this, this.tools.horizontalScale, {
            // ... axis properties ...
        })
    }
})
```

It is an easy way of sharing the same tools with several widgets, if that's the case. It will likely happen often.

### Event responsiveness

Our visualizations are responsive to events. That's what it uses to communicate to the outside world and also what it uses to communicate with its own components.  

Basically, any change to the visualization must be invoked by an event. Whenever the state changes, the language changes or the visualization is ready to be rendered -- all of these are considered events -- we must trigger a corresponding event through the Events Manager. Some methods, such as `setState` and `setLanguage` already have this setup in 'base.js'. Below you find the code to trigger events. It gives you a start of what to do when the situation comes along.

```javascript
this.instances.events.trigger(eventName, data, ...);
```

As the visualization responds to events, you must bind actions to these events. The actions are functions and they are called whenever the event is triggered.

```javascript
this.instances.events.bind(eventName, function(data, ...) {
    // handle event here
});
```

This anonymous function above will run when the event is triggered.  

The Events Manager also provides the functionality to unbind a function from an event. In order to unbind functions you must provide the reference to that particular function. Doing it with anonymous functions is, well, a little painful. You'd be safer doing something in the lines of:

```javascript
function unbindOnTrigger(eventName) {
    // handle event
    // ...

    // when its over, unbind itself
    this.instances.events.unbind(eventName, this);
}

this.instances.events.bind(eventName, unbindOnTrigger);
```

A tip: avoid using `arguments.callee` here. Seems to be much slower than just naming the function.

```javascript
// don't use arguments.callee
this.instances.events.bind(eventName, function name() {
    // handle
    this.instances.events.unbind(eventName, name);
})
```

### Getters and setters

Visualization properties should always be set using a proper `setXXX` function and loaded as `getXXX` functions. Various set/get are needed (by modules, for example) and they are already described in 'base.js'. Here's a list:

* Getters
    - `getSVG` returns the visualization svg space
    - `getState` returns the visualization state
    - `getLanguage` returns the visualization UI language
    - `getLayout` returns the visualization layout rules
    - `getInstance` returns the visualization manager instances
    - `getProperties` returns a bundle of the visualization properties, such as tools, widgets, etc.

* Setters
    - `setState` replaces the visualization state
    - `setLayout` replaces the visualization layout rules
    - `setLanguage` tells the visualization to switch to another language
    - `setProperties` sets visualization properties. Check for (useful) convenience.

Check the code to see what they do and how they do it. It's very straightforward. The interesting one is {get,set}Properties, where we return a bundle of visualization properties in one object. This is to facilitate setting such properties, as it becomes a little handy to use this method instead of creating special functions for all properties of a visualization -- and keeping track of them. It's a convenient method.

### Start

It's the function called by the core to start a visualization. Through this function, start all widgets, bind all events, load the data and set the layout. It's basically the 'on' button in a switch: when you run this method, start the whole visualization. This should only be executed once per visualization (make sure you safe guard for this).

### Destroy

Removes a visualization. This method deactivates a visualization and should contain everything to completely turn off a visualization. It is not simply removing an element from the DOM; it's much more than that. You have to de-register managers, turn off any global binders you have set, de-register any listeners, and remove elements from the DOM. Remember: just because it's not in the screen doesn't mean that it doesn't exist.

## Testing

We kept it simple, by having an HTML file with a JavaScript script being executed loading our code. At the moment, we are working on a Grunt builder/livereload solution that will solve our building/testing process.

To check out your visualization, load the file `root/test/test.html` on Chrome.

Open the same file on a text editor to edit the script.

### On console

The core object is accessible at `window.vizabi` (per `test.html`).