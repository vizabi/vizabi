function openStateEditor() {
  addClass(window.document.body, "vzbp-nav-state-editor");
  addClass(document.getElementById("state-section-panel"), "open");
}

function closeStateEditor() {
  removeClass(window.document.body, "vzbp-nav-state-editor");
  removeClass(document.getElementById("state-section-panel"), "open");
}

function toggleStateEditor() {
  toggle(window.document.body, "vzbp-nav-state-editor", closeStateEditor, openStateEditor);

  //normalize size of the main div
  setTimeout(function() {
    var placeholder = document.getElementById('vzbp-placeholder');
    var container = document.getElementById('vzbp-main');
    setDivSize(placeholder, container);
    updateURL();
  }, 300);
}

function updateStateEditor(state) {
  var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
  editorTextArea.value = JSON.stringify(state, null, 2);
  editorTextArea.removeAttribute('disabled');
  removeClass(editorTextArea, "invalid");
}

function setState() {
  var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
  var state = editorTextArea.value;
  try {
    state = JSON.parse(state);
    removeClass(editorTextArea, "invalid");
    VIZABI_OPTIONS.state = state;
    VIZ.setOptions(VIZABI_OPTIONS);
    updateURL();
  } catch(err) {
    addClass(editorTextArea, "invalid");
  }
}

/*
 * State Section
 */
document.getElementById('state-section').onclick = toggleStateEditor;
document.getElementById("vzbp-state-editor-textarea").onchange = setState;