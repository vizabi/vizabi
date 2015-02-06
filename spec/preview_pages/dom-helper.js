function initializeDom() {
    var div = document.createElement('div');
    div.id = 'placeholder';
    div.style.width = '800px';
    div.style.height = '600px';
    document.body.appendChild(div);
    document.body.style.margin = '0px';

    //disable timestamp
    window.console.timeStamp = function() {};
}

function initializeVizabi(viz, options, done) {
    if (typeof vizabi === 'undefined') {
        window.initializeDom();
    }
    vizabi = new Vizabi(viz, "#placeholder", options);

    window.setTimeout(function() {
        done();
    }, 300);

    return vizabi;
}

function mapReady(model) {
    var map = {};
    for(var i in model._data) {
        var submodel = model._data[i];
        if(typeof submodel._id === "undefined") continue;
        map[i] = {};
        map[i] = mapReady(submodel);
        map[i]._ready = submodel._ready;
    }
    return map;
}
