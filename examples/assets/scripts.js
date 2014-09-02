function randomSize(id) {
    var width = Math.floor(Math.random() * 800) + 300;
    var height = Math.floor(Math.random() * 500) + 300;
    var container = document.getElementById(id);
    container.style.width = width + "px";
    container.style.height = height + "px";

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