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
    language: {
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
  e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar-2.js');
  e.setAttribute('class', 'svg-crowbar');
  document.body.appendChild(e);
  setTimeout(function(){
    var element = document.querySelectorAll('[data-source-id="0"]');
    if(element[0]){
      element[0].click();
    }
    d3.selectAll('.svg-crowbar').remove();
    
  },1000)
  
}

document.getElementById("vzbp-btn-play").onclick = play;
document.getElementById("vzbp-btn-lang").onclick = function() {
  language('se')
};
document.getElementById("vzbp-btn-record").onclick = recstart;
document.getElementById("vzbp-btn-download").onclick = download; 
