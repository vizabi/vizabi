forEachElement(".collapsible-section", function(el, i) {
    var title = el.querySelectorAll(".vzbp-collapsible-title")[0];
    title.onclick = function() {
        toggleCollapsible(el);
	};
});

function toggleCollapsible(el) {
    toggle(el, "open");
    updateURL();
}