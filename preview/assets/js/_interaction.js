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

document.getElementById("vzbp-btn-play").onclick = play;
document.getElementById("vzbp-btn-lang").onclick = function() {
  language('se')
};
document.getElementById("vzbp-btn-record").onclick = recstart;