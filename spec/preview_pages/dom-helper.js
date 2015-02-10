function initializeDom() {
    //insert wrapper (for styling purposes only)
    var div = document.createElement('div');
    div.id = 'test-wrapper';
    //insert placeholder
    var placeholder = document.createElement('div');
    placeholder.id = 'test-placeholder';

    //add to page
    div.appendChild(placeholder);
    document.body.appendChild(div);

    //disable timestamp
    window.console.timeStamp = function() {};
}

//global vizabi helps us know if something should be initialized
var vizabi;
function initializeVizabi(viz, options, done) {

    var interval = 800;
    if (typeof vizabi === 'undefined') {
        window.initializeDom();
    }
    vizabi = new Vizabi(viz, "#test-placeholder", options);

    window.setTimeout(function() {
        done();
    }, interval);
    return vizabi;
}

function mobile(bool, orientation) {

    var placeholder = $("#test-placeholder");
    if(bool) {
        placeholder.addClass('mobile');
        if(!orientation) orientation = "portrait";
        if(orientation === 'landscape') {
            placeholder.addClass('landscape');
        }
        else {
            placeholder.removeClass('landscape');
        }
    }
    else {
        placeholder.addClass('mobile');
        placeholder.removeClass('landscape');
    }
}

function mapReady(model) {
    var map = {};
    for (var i in model._data) {
        var submodel = model._data[i];
        if (typeof submodel._id === "undefined") continue;
        map[i] = {};
        map[i] = mapReady(submodel);
        map[i]._ready = submodel._ready;
    }
    return map;
}