/*  ADAPTED FROM SOLUTION BY @author https://twitter.com/blurspline
 *  See post http://www.lab4games.net/zz85/blog/2014/11/15/resizing-moving-snapping-windows-with-js-css/
 */

function resizableDiv(pane, container, minWidth, minHeight, cb) {

    // Thresholds
    var FULLSCREEN_MARGINS = -10;
    var MARGINS = 20;

    var maxWidth = container.offsetWidth - MARGINS;
    var maxHeight = container.offsetHeight - MARGINS;

    // End of what's configurable.
    var clicked = null;
    var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

    var rightScreenEdge, bottomScreenEdge;

    var preSnapped;

    var b, x, y;

    var redraw = false;

    function setBounds(element, x, y, w, h) {
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.style.width = w + 'px';
        element.style.height = h + 'px';
    }

    // Mouse events
    pane.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    // Touch events 
    pane.addEventListener('touchstart', onTouchDown);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);


    function onTouchDown(e) {
        onDown(e.touches[0]);
        e.preventDefault();
    }

    function onTouchMove(e) {
        onMove(e.touches[0]);
    }

    function onTouchEnd(e) {
        if (e.touches.length == 0) onUp(e.changedTouches[0]);
    }

    function onMouseDown(e) {
        onDown(e);
        e.preventDefault();
    }

    function onDown(e) {
        calc(e);

        var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;

        clicked = {
            x: x,
            y: y,
            cx: e.clientX,
            cy: e.clientY,
            w: b.width,
            h: b.height,
            isResizing: isResizing,
            onTopEdge: onTopEdge,
            onLeftEdge: onLeftEdge,
            onRightEdge: onRightEdge,
            onBottomEdge: onBottomEdge
        };
    }

    function calc(e) {
        b = pane.getBoundingClientRect();
        x = e.clientX - b.left;
        y = e.clientY - b.top;

        onTopEdge = y < MARGINS;
        onLeftEdge = x < MARGINS;
        onRightEdge = x >= b.width - MARGINS;
        onBottomEdge = y >= b.height - MARGINS;
    }

    var e;

    function onMove(ee) {
        calc(ee);

        e = ee;

        redraw = true;

    }

    function animate() {

        requestAnimationFrame(animate);

        if (!redraw) return;

        redraw = false;

        if (clicked && clicked.isResizing) {

            maxWidth = container.offsetWidth - MARGINS;
            maxHeight = container.offsetHeight - MARGINS;

            if (clicked.onRightEdge) pane.style.width = Math.min(Math.max(x, minWidth), maxWidth) + 'px';

            if (clicked.onBottomEdge) pane.style.height = Math.min(Math.max(y, minHeight), maxHeight) + 'px';

            if(cb) {
                cb();
            }

            return;
        }
        // This code executes when mouse moves without clicking

        // style cursor
        if (onRightEdge && onBottomEdge) {
            pane.style.cursor = 'nwse-resize !important';
        } else if (onRightEdge) {
            pane.style.cursor = 'ew-resize !important';
        } else if (onBottomEdge) {
            pane.style.cursor = 'ns-resize !important';
        } else {
            pane.style.cursor = 'default';
        }
    }

    animate();

    function onUp(e) {
        calc(e);

        clicked = null;
    }
}

function setDivSize(div, width, height) {
    div.style.width = width + 'px';
    div.style.height = height + 'px';

    forceResizeEvt();
    updateSizePanel(div, width, height);
}

function setDivRandomSize(div, container) {
    var MARGINS = 20;
    var maxWidth = container.offsetWidth - MARGINS;
    var maxHeight = container.offsetHeight - MARGINS;
    var minWidth = 300;
    var minHeight = 300;

    var width = Math.round(Math.random() * (maxWidth - minWidth)) + minWidth;
    var height = Math.round(Math.random() * (maxHeight - minHeight)) + minHeight;

    setDivSize(div, width, height);
}

function normalizeDivSize(div, container) {
    var MARGINS = 20;
    var maxWidth = container.offsetWidth - MARGINS;
    var maxHeight = container.offsetHeight - MARGINS;
    var minWidth = 300;
    var minHeight = 300;
    var divWidth = parseInt(div.style.width,10);
    var divHeight = parseInt(div.style.height,10);

    var width = Math.min(Math.max(divWidth, minWidth), maxWidth);
    var height = Math.min(Math.max(divHeight, minHeight), maxHeight);

    if(divWidth != width || divHeight != height) {
        // console.warn("Size outside range. Setting size to:", width, height);
        setDivSize(div, width, height);
    }
}

function forceResizeEvt() {
    //force resize
    event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, true);
    event.eventName = "resize";
    window.dispatchEvent(event);
}

function updateSizePanel(div, width, height) {
    if(!width) width = parseInt(div.style.width,10);
    if(!height) height = parseInt(div.style.height,10);
    document.getElementById("vzbp-input-width").value = width;
    document.getElementById("vzbp-input-height").value = height;
}

/*
 * Resize Section
 */

//update size
setDivSize(placeholder, 320, 568);
//resize div
resizableDiv(placeholder, container, 300, 300, function() {
    forceResizeEvt();
    updateSizePanel(placeholder);
});

document.getElementById('vzbp-btn-portrait').onclick = function() {
    setDivSize(placeholder, 320, 568);
    normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-landscape').onclick = function() {
    setDivSize(placeholder, 568, 320);
    normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-desktop').onclick = function() {
    setDivSize(placeholder, container.offsetWidth, container.offsetHeight);
    normalizeDivSize(placeholder, container);
};
document.getElementById('vzbp-btn-random').onclick = function() {
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