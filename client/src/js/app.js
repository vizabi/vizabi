//changing Vizabi

Vizabi._globals.gapminder_paths.baseUrl = "http://static.gapminderdev.org/vizabi/develop/preview/";

//main app module

angular.module('gapminderTools', []);

//TODO: remove global

function forceResizeEvt() {
    //force resize
    event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, true);
    event.eventName = "resize";
    window.dispatchEvent(event);
}