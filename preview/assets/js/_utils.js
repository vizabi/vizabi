function addClass(el, className) {
  if(el.classList)
    el.classList.add(className);
  else
    el.className += ' ' + className;
}

function removeClass(el, className) {
  if(el.classList)
    el.classList.remove(className);
  else
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}

function hasClass(el, className) {
  if(el.classList)
    return el.classList.contains(className);
  else
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
}

function forEachElement(selector, fn) {
  var elements = document.querySelectorAll(selector);
  for(var i = 0; i < elements.length; i++)
    fn(elements[i], i);
}

//toggleClasses, with or without callbacks
function toggle(el, className, ifTrue, ifFalse) {
  if(hasClass(el, className)) {
    removeClass(el, className);
    if(ifTrue) ifTrue();
  } else {
    addClass(el, className);
    if(ifFalse) ifFalse();
  }
}

function getJSON(url, param, callback, err) {
  var request = new XMLHttpRequest();
  var pars = [];
  for(var i in param) {
    pars.push(i + "=" + param[i]);
  };
  request.open('GET', url + '?' + pars.join("&"), true);
  request.onload = function() {
    if(request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      if(callback) callback(data);
    } else {
      if(err) err();
    }
  };
  request.onerror = function() {
    if(err) err();
  };
  request.send();
}

function openLink(link) {
  window.open(link, '_blank');
}

//throttle function
var throttle = (function throttle() {
  var isThrottled = {};
  return function(func, ms) {
    if(isThrottled[func]) {
      return
    };
    isThrottled[func] = true;
    setTimeout(function() {
      isThrottled[func] = false;
    }, ms);
    func();
  }
})();
