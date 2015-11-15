/*  ADAPTED FROM SOLUTION BY @author https://twitter.com/blurspline
 *  See post http://www.lab4games.net/zz85/blog/2014/11/15/resizing-moving-snapping-windows-with-js-css/
 */

function resizableDiv(pane, container, minWidth, minHeight, cb, cbMouseUp) {

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
    // e.preventDefault();
  }

  function onTouchMove(e) {
    onMove(e.touches[0]);
  }

  function onTouchEnd(e) {
    if(e.touches.length == 0) onUp(e.changedTouches[0]);
  }

  function onMouseDown(e) {
    onDown(e);
    // e.preventDefault();
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
    if (window.requestAnimationFrame) {
      requestAnimationFrame(animate);
    } else if (window.webkitRequestAnimationFrame) {
      webkitRequestAnimationFrame(animate);
    }

    if(!redraw) return;

    redraw = false;

    if(clicked && clicked.isResizing) {

      maxWidth = container.offsetWidth - MARGINS;
      maxHeight = container.offsetHeight - MARGINS;

      if(clicked.onRightEdge) pane.style.width = Math.min(Math.max(x, minWidth), maxWidth) + 'px';

      if(clicked.onBottomEdge) pane.style.height = Math.min(Math.max(y, minHeight), maxHeight) + 'px';

      if(cb) {
        cb();
      }

      return;
    }
    // This code executes when mouse moves without clicking

    // style cursor
    if(onRightEdge && onBottomEdge) {
      pane.style.cursor = 'nwse-resize !important';
    } else if(onRightEdge) {
      pane.style.cursor = 'ew-resize !important';
    } else if(onBottomEdge) {
      pane.style.cursor = 'ns-resize !important';
    } else {
      pane.style.cursor = 'default';
    }
  }

  animate();

  function onUp(e) {
    calc(e);

    if(cbMouseUp) {
      cbMouseUp();
    }

    clicked = null;
  }
}

function setDivSize(div, container, width, height) {
  if(!width)
    width = parseInt(div.style.width, 10);
  if(!height)
    height = parseInt(div.style.height, 10);

  var size = getNormalDivSize(div, container, width, height);
  div.style.width = size.width + 'px';
  div.style.height = size.height + 'px';
  removeClass(div, "fullscreen");
  forceResizeEvt();
  updateSizePanel(div, size.width, size.height);
}

function setDivRandomSize(div, container) {
  var MARGINS = 20;
  var maxWidth = container.offsetWidth - MARGINS;
  var maxHeight = container.offsetHeight - MARGINS;
  var minWidth = 300;
  var minHeight = 300;

  var width = Math.round(Math.random() * (maxWidth - minWidth)) + minWidth;
  var height = Math.round(Math.random() * (maxHeight - minHeight)) + minHeight;

  setDivSize(div, container, width, height);
}

function getNormalDivSize(div, container, divWidth, divHeight) {
  var MARGINS = 20;
  var maxWidth = container.offsetWidth - MARGINS;
  var maxHeight = container.offsetHeight - MARGINS;
  var minWidth = 300;
  var minHeight = 300;

  var width = Math.min(Math.max(divWidth, minWidth), maxWidth);
  var height = Math.min(Math.max(divHeight, minHeight), maxHeight);

  return {
    width: width,
    height: height
  };
}

var forcedResize = false;

function forceResizeEvt() {
  //force resize
  event = document.createEvent("HTMLEvents");
  event.initEvent("resize", true, true);
  event.eventName = "resize";
  forcedResize = true;
  window.dispatchEvent(event);
  forcedResize = false;
}

function updateSizePanel(div, width, height) {
  if(!width) width = parseInt(div.style.width, 10);
  if(!height) height = parseInt(div.style.height, 10);
  document.getElementById("vzbp-input-width").value = width;
  document.getElementById("vzbp-input-height").value = height;
}

/*
 * Resize Section
 */

//update size
setDivSize(placeholder, container, 320, 568);
//resize div
resizableDiv(placeholder, container, 300, 300, function() {
  forceResizeEvt();
  updateSizePanel(placeholder);
}, function() {
  removeClass(placeholder, "fullscreen");
  updateURL(true);
});

function setFullscreen() {
  setDivSize(placeholder, container, container.offsetWidth, container.offsetHeight);
  addClass(placeholder, "fullscreen");
  updateURL(true);
}

document.getElementById('vzbp-btn-portrait').onclick = function() {
  setDivSize(placeholder, container, 320, 568);
  updateURL();
};
document.getElementById('vzbp-btn-landscape').onclick = function() {
  setDivSize(placeholder, container, 568, 320);
  updateURL();
};
document.getElementById('vzbp-btn-desktop').onclick = setFullscreen;
document.getElementById('vzbp-btn-random').onclick = function() {
  setDivRandomSize(placeholder, container);
  updateURL();
};

//change sizes manually
var inputWidth = document.getElementById('vzbp-input-width');
var inputHeight = document.getElementById('vzbp-input-height');

function changeSizes() {
  var width = parseInt(inputWidth.value, 10);
  var height = parseInt(inputHeight.value, 10);
  setDivSize(placeholder, container, width, height);
  updateURL();
}

inputWidth.onchange = changeSizes;
inputHeight.onchange = changeSizes;

window.addEventListener('resize', function() {
  if(forcedResize) return;
  if(hasClass(placeholder, 'fullscreen')) {
    setFullscreen();
  } else if (!hasClass(container, 'vzb-container-fullscreen') && (container.offsetWidth < placeholder.offsetWidth || container.offsetHeight < placeholder.offsetHeight)) {
    setDivSize(placeholder, container, Math.min(container.offsetWidth, placeholder.offsetWidth), Math.min(container.offsetHeight, placeholder.offsetHeight));
  }
  updateURL();
});
