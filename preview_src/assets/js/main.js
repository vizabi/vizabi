//div is resizable
var placeholder = document.getElementById('vzbp-placeholder');
var container = document.getElementById('vzbp-main');
var editor = document.getElementById("vzbp-state-editor-text");
var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
var viz;

resizableDiv(placeholder, container, 300, 300, function() {
	forceResizeEvt();
	updateSizePanel(placeholder);
});

/*
 * Share Section
 */


/*
 * Resize Section
 */

document.getElementById('vzbp-btn-portrait').onclick = function(){
	setDivSize(placeholder, 320, 568);
	normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-landscape').onclick = function(){
	setDivSize(placeholder, 568, 320);
	normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-tablet').onclick = function(){
	setDivSize(placeholder, 768, 1024);
	normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-desktop').onclick = function(){
	setDivSize(placeholder, container.offsetWidth, container.offsetHeight);
	normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-random').onclick = function(){
	setDivRandomSize(placeholder, container);
};

//change sizes manually
var inputWidth = document.getElementById('vzbp-input-width');
var inputHeight = document.getElementById('vzbp-input-height');

function changeSizes() {
	var width = parseInt(inputWidth.value, 10);
	var height = parseInt(inputHeight.value, 10);
	setDivSize(placeholder, width, height);
	normalizeDivSize(placeholder, container);
}

inputWidth.onchange = changeSizes;
inputHeight.onchange = changeSizes;

/*
 * State Section
 */
document.getElementById('state-section').onclick = toggleStateEditor;