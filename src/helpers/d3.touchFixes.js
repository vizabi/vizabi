import { isTouchDevice } from "base/utils";

//TODO: Fix for scroll on mobile chrome on d3 v3.5.17. It must be retested/removed on d3 v4.x.x
//see explanation here https://github.com/vizabi/vizabi/issues/2020#issuecomment-250205191

function touchcancel() {
  d3.event.target.dispatchEvent(new TouchEvent("touchend", d3.event));
}

const drag = (function(_d3_behaviour_drag) {
  if (!isTouchDevice()) return _d3_behaviour_drag;

  return function() {

    return (function(_super) {

      function drag() {
        _super.call(this);
        this.on("mousedown.drag", null);
        this.on("touchcancel", touchcancel);
      }

      return d3.rebind(drag, _super, "origin", "on");
    })(_d3_behaviour_drag());
  };
})(d3.behavior.drag);


const zoom = (function(_d3_behaviour_zoom) {
  if (!isTouchDevice()) return _d3_behaviour_zoom;

  return function() {

    return (function(_super) {

      function zoom(g) {
        _super(g);
        g.on("mousedown.zoom", null);
        g.on("touchcancel", touchcancel);
        zoom.on("zoomend.clearmousedown", () => {
          g.on("mousedown.zoom", null);
        });
      }

      return d3.rebind(zoom, _super, "translate", "scale", "scaleExtent", "center", "size", "x", "y", "on", "event");
    })(_d3_behaviour_zoom());
  };
})(d3.behavior.zoom);


const brush = (function(_d3_svg_brush) {
  if (!isTouchDevice()) return _d3_svg_brush;

  function d3_window(node) {
    return node && (node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView);
  }

  return function() {

    return (function(_super) {

      function brushstart() {
        brush.on("brushend.touchcancel", brushend);

        const w = d3.select(d3_window(this));
        w.on("touchcancel.brush", touchcancel);

        function brushend() {
          w.on("touchcancel.brush", null);
        }

      }

      function brush(g) {
        _super(g);
        g.each(function() {
          const g = d3.select(this).on("mousedown.brush", null);
        });
        brush.on("brushstart.touchcancel", brushstart);
      }

      return d3.rebind(brush, _super, "x", "y", "extent", "clamp", "clear", "empty", "on", "event");
    })(_d3_svg_brush());
  };
})(d3.svg.brush);

export default {
  brush,
  drag,
  zoom
};

export { brush, drag, zoom };
