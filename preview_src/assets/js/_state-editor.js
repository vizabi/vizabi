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
        normalizeDivSize(placeholder, container);
    }, 300);
}

function formatDate(date, unit) {
    var timeFormats = {
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%Y-%m"),
        "week": d3.time.format("%Y-W%W"),
        "day": d3.time.format("%Y-%m-%d"),
        "hour": d3.time.format("%Y-%m-%d %H"),
        "minute": d3.time.format("%Y-%m-%d %H:%M"),
        "second": d3.time.format("%Y-%m-%d %H:%M:%S")
    };
    return timeFormats[unit](date);
}

function formatDates(state) {
    // Format date objects according to the unit
    if (state && state.time && state.time.unit) {
        if (typeof state.time.value === 'object') {
            state.time.value = formatDate(state.time.value, state.time.unit);
        }
        if (typeof state.time.start === 'object') {
            state.time.start = formatDate(state.time.start, state.time.unit);
        }
        if (typeof state.time.end === 'object') {
            state.time.end = formatDate(state.time.end, state.time.unit);
        }
    }
}

function updateStateEditor(state) {
    var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
    formatDates(state);
    editorTextArea.value = JSON.stringify(state, null, 2);
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
    }
    catch(err) {
        addClass(editorTextArea, "invalid");
    }
}

/*
 * State Section
 */
document.getElementById('state-section').onclick = toggleStateEditor;
document.getElementById("vzbp-state-editor-textarea").onchange = setState;