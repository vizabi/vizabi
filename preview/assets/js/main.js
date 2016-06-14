//div is resizable
var placeholder = document.getElementById('vzbp-placeholder');
var container = document.getElementById('vzbp-main');
var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
var viz;


/*
 * Share Section
 */

document.getElementById("vzbp-btn-refresh").onclick = resetURL;
document.getElementById("vzbp-btn-codepen").onclick = function() {
  //get state
  var STATE = VIZ.getModel().state;
  formatDates(STATE);
  STATE = JSON.stringify(STATE, null, 2);

  var BRANCH = location.href.substring(0, location.href.indexOf("preview/")) + "dist/";

  viewOnCodepen(TITLE, TOOL, BRANCH, STATE);
};
document.getElementById("vzbp-btn-share").onclick = shareLink;

//share link
function shareLink() {
  updateURL();

  //TINYURL
  // var address = "http://tinyurl.com/api-create.php",
  //     params = {
  //         url: encodeURIComponent(document.URL)
  //     };
  // getJSON(address, params, function(response) {
  //     if (response) {
  //         prompt("Copy the following link: ", response);
  //     } else {
  //         prompt("Copy the following link: ", window.location);
  //     }
  // });

  //BITLY
  var address = "https://api-ssl.bitly.com/v3/shorten",
    params = {
      access_token: "8765eb3be5b975830e72af4e0949022cb53d9596",
      longUrl: encodeURIComponent(document.URL)
    };
  getJSON(address, params, function(response) {
    if(+response.status_code == 200) {
      prompt("Copy the following link: ", response.data.url);
    } else {
      prompt("Copy the following link: ", window.location);
    }
  });
}

function setHook(params) {
  var model = {
    state: {
      marker: {}
    }
  };
  model.state.marker[params.hook] = {
    use: params.use,
    which: params.which
  };
  // for time only
  if(params.scaleType != null) model.state.marker[params.hook].scaleType = params.scaleType;
  //for color only
  if(params.palette) model.state.marker[params.hook].palette = params.palette;
  VIZ.setModel(model);
}

function setEntities(filterGeo, filterGeoCategory) {
  var model = {
    state: {
      entities: {
        show: {
          filter: {}
        }
      }
    }
  };
  model.state.entities.show.filter = {
    "geo": filterGeo,
    "geo.category": filterGeoCategory
  }
  VIZ.setModel(model);
}