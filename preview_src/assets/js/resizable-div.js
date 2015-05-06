/*  ADAPTED FROM SOLUTION BY @author https://twitter.com/blurspline
 *  See post http://www.lab4games.net/zz85/blog/2014/11/15/resizing-moving-snapping-windows-with-js-css/
 */

function resizableDiv(pane, container, minWidth, minHeight) {

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
            isMoving: !isResizing && canMove(),
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

            return;
        }

        if (clicked && clicked.isMoving) {
            // moving
            pane.style.top = (e.clientY - clicked.y) + 'px';
            pane.style.left = (e.clientX - clicked.x) + 'px';
            return;
        }

        // This code executes when mouse moves without clicking

        // style cursor
        if (onRightEdge && onBottomEdge) {
            pane.style.cursor = 'nwse-resize';
        } else if (onRightEdge) {
            pane.style.cursor = 'ew-resize';
        } else if (onBottomEdge) {
            pane.style.cursor = 'ns-resize';
        } else {
            pane.style.cursor = 'default';
        }
    }

    animate();

    function onUp(e) {
        calc(e);

        if (clicked && clicked.isMoving) {
            // Snap
            var snapped = {
                width: b.width,
                height: b.height
            };

        }

        clicked = null;
    }
}