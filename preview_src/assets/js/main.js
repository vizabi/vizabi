//div is resizable
var placeholder = document.getElementById('vzbp-placeholder');
var container = document.getElementById('vzbp-main');
var viz;

resizableDiv(placeholder, container, 300, 300);

viz = new Vizabi("_examples/bar-chart", placeholder);