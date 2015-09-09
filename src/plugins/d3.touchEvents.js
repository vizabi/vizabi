(function () {
  'use strict';

  var root = this;
  if (!Vizabi._require('d3'))
    return;

  function detectTouchEvent(element, onTap, onLongTap) {
    var start;
    var namespace = onTap ? '.onTap' : '.onLongTap';
    d3.select(element)
      .on('touchstart' + namespace, function (d, i) {
        start = d3.event.timeStamp;
      })
      .on('touchend' + namespace, function (d, i) {
        if (d3.event.timeStamp - start < 500)
          return onTap ? onTap(d, i) : undefined;
        return onLongTap ? onLongTap(d, i) : undefined;
      });
  }

  d3.selection.prototype.onTap = function (callback) {
    return this.each(function () {
      detectTouchEvent(this, callback);
    })
  };

  d3.selection.prototype.onLongTap = function (callback) {
    return this.each(function () {
      detectTouchEvent(this, null, callback);
    })
  };

}.call(this));
