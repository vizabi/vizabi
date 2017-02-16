function detectTouchEvent(element, onTap, onLongTap) {
  var start;
  var coordX;
  var coordY;
  var namespace = onTap ? '.onTap' : '.onLongTap';
  d3.select(element)
    .on('touchstart' + namespace, function(d, i) {
      start = d3.event.timeStamp;
      coordX = d3.event.changedTouches[0].screenX;
      coordY = d3.event.changedTouches[0].screenY;
    })
    .on('touchend' + namespace, function(d, i) {
      coordX = Math.abs(coordX - d3.event.changedTouches[0].screenX);
      coordY = Math.abs(coordY - d3.event.changedTouches[0].screenY);
      if (coordX < 5 && coordY < 5) {
        if (d3.event.timeStamp - start < 500)
          return onTap ? onTap(d, i) : undefined;
        return onLongTap ? onLongTap(d, i) : undefined;
      } else return undefined;
    });
}

//d3.selection.prototype.onTap
var onTap = function(callback) {
  return this.each(function() {
    detectTouchEvent(this, callback);
  });
};

//d3.selection.prototype.onLongTap
var onLongTap = function(callback) {
  return this.each(function() {
    detectTouchEvent(this, null, callback);
  });
};

export default {
  onTap: onTap,
  onLongTap: onLongTap
};

export {
  onTap,
  onLongTap
};
