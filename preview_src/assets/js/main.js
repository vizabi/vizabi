//div is resizable
var placeholder = document.getElementById('vzbp-placeholder');
var container = document.getElementById('vzbp-main');
var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
var viz;


/*
 * Share Section
 */

document.getElementById("vzbp-btn-refresh").onclick = resetURL;
document.getElementById("vzbp-btn-codepen").onclick = updateURL;
document.getElementById("vzbp-btn-share").onclick = shareLink;

//share link
function shareLink() {
    updateURL();
    var address = "https://api-ssl.bitly.com/v3/shorten",
        params = {
            access_token: "8765eb3be5b975830e72af4e0949022cb53d9596",
            longUrl: document.URL
        };
    getJSON(address, params, function(response) {
        if (response.status_code == "200") {
            prompt("Copy the following link: ", response.data.url);
        } else {
            prompt("Copy the following link: ", window.location);
        }
    });
}

function setHook(params) {
    var options = {
        state: {
            marker: {}
        }
    };
    options.state.marker[params.hook] = {
        use: params.use,
        value: params.value
    };
    // for time only
    if (params.scale != null) options.state.marker[params.hook].scale = params.scale;
    //for color only
    if (params.domain) options.state.marker[params.hook].domain = params.domain;
    VIZ.setOptions(options);
    if(setState) setState();
}

function setEntities(filterGeo, filterGeoCategory) {
    var options = {state: {entities: {show: {filter: {}}}}};
    options.state.entities.show.filter = {
        "geo": filterGeo,
        "geo.category": filterGeoCategory
    }
    VIZ.setOptions(options);
    if(setState) setState();
}