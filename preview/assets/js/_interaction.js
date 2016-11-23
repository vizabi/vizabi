function play() {
  var model = {
    state: {
      time: {
        playing: true
      }
    }
  };
  VIZ.setModel(model);
}

function pause() {
  var model = {
    state: {
      time: {
        playing: false
      }
    }
  };
  VIZ.setModel(model);
}

function language(lang) {
  var model = {
    locale: {
      id: lang
    }
  };
  VIZ.setModel(model);
}

function recstart() {
  var model = {
    state: {
      time: {
        record: true
      }
    }
  };
  VIZ.setModel(model);
}

function recstop() {
  var model = {
    state: {
      time: {
        record: false
      }
    }
  };
  VIZ.setModel(model);
}

function download(){
  window.URL = null;
  var e = document.createElement('script');
  e.setAttribute('src', 'assets/js/svg-crowbar-2.js');
  e.setAttribute('class', 'svg-crowbar');
  e.setAttribute('data-svg-select', 'div>svg.vzb-export');
  e.setAttribute('data-exclude-element-select', '.vzb-noexport');
  document.body.appendChild(e);  
}

document.getElementById("vzbp-btn-play").onclick = play;
document.getElementById("vzbp-btn-lang").onchange = function() {language(this.value)};
document.getElementById("vzbp-btn-record").onclick = recstart;
document.getElementById("vzbp-btn-download").onclick = download; 
