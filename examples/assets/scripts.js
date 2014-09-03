function randomSize(id) {
    var width = Math.floor(Math.random() * 800) + 300;
    var height = Math.floor(Math.random() * 500) + 300;
    var container = document.getElementById(id);
    container.style.width = width + "px";
    container.style.height = height + "px";
    container.className = "placeholder";

    forceResizeEvt();
}

function phoneSize(id, mode) {
    var container = document.getElementById(id);
    if (mode === 'landscape') {
        container.style.width = "568px";
        container.style.height = "320px";
    } else {
        container.style.width = "320px";
        container.style.height = "568px";
    }
    container.className = "placeholder";
    forceResizeEvt();
}

function fullSize(id) {
    var container = document.getElementById(id);
    container.style.width = "auto";
    container.style.height = "auto";
    container.className = "placeholder fullscreen";
    forceResizeEvt();
}

function forceResizeEvt() {
    //force resize
    event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, true);
    event.eventName = "resize";
    window.dispatchEvent(event);
}

function setLanguage(id, language) {
    var newOption = {
        language: language
    };
    myVizabi.setOptions("#" + id, newOption);
}

function setCurrentState(id, idState) {
    if (!idState) {
        idState = "state";
    }
    var state = document.getElementById(idState).innerHTML;
    state = JSON.parse(state);
    var newOption = {
        state: state
    };
    myVizabi.setOptions("#" + id, newOption);
}

function showState(state, id) {
    if (!id) {
        id = "state";
    }
    var container = document.getElementById(id);
    var str = JSON.stringify(state, null, 2);
    container.innerHTML = str;
}

function showQuery(query) {
    var container = document.getElementById("query");
    var str = JSON.stringify(query, null, 2);
    container.innerHTML = str;
}