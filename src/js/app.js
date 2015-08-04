//main app module

angular.module('gapminderWorld', []);

//TODO: remove global

function forceResizeEvt() {
    //force resize
    event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, true);
    event.eventName = "resize";
    window.dispatchEvent(event);
}

function dataToUrl(data) {
    var state = {};
    state.id =  data.language.id;
    state.state = data.state;
    location.hash = JSON.stringify(state);
}
