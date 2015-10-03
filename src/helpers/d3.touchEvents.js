function detectTouchEvent(element, onTap, onLongTap) {
  var start;
  var namespace = onTap ? '.onTap' : '.onLongTap';
  d3.select(element)
    .on('touchstart' + namespace, function(d, i) {
      start = d3.event.timeStamp;
    })
    .on('touchend' + namespace, function(d, i) {
      if(d3.event.timeStamp - start < 500)
        return onTap ? onTap(d, i) : undefined;
      return onLongTap ? onLongTap(d, i) : undefined;
    });
}

//d3.selection.prototype.onTap
var onTap = function(callback) {
  return this.each(function() {
    detectTouchEvent(this, callback);
  })
};

//d3.selection.prototype.onLongTap
var onLongTap = function(callback) {
  return this.each(function() {
    detectTouchEvent(this, null, callback);
  })
};

export default {
  onTap: onTap,
  onLongTap: onLongTap
};

export {
  onTap,
  onLongTap
};