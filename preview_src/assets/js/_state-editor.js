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
}