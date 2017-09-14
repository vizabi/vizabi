//d3.svg.collisionResolver

export default function collisionResolver() {
  return (function collision_resolver() {
    const DURATION = 300;
    let labelHeight = 0;
    // MAINN FUNCTION. RUN COLLISION RESOLVER ON A GROUP g
    function resolver(g) {
      if (selector == null) {
        console.warn("D3 collision resolver stopped: missing a CSS slector");
        return;
      }
      if (height == null) {
        console.warn("D3 collision resolver stopped: missing height of the canvas");
        return;
      }
      if (value == null) {
        console.warn(
          "D3 collision resolver stopped: missing pointer within data objects. Example: value = 'valueY' ");
        return;
      }
      if (KEY == null) {
        console.warn("D3 collision resolver stopped: missing a key for data. Example: key = 'geo' ");
        return;
      }
      labelHeight = g.node().getBBox().height * 0.8;
      //actually reposition the labels
      const data = g.filter(d => filter(d, time))
        .sort((x, y) => d3.ascending(x.valueY, y.valueY))
        .data();
      const keys = {};
      for (let i = 0; i < data.length - 1; i++) {
        const first = data[i];
        const second = data[i + 1];
        if (!first.shiftY) first.shiftY = 0;
        second.shiftY = 0;
        if ((second.valueY - first.valueY - first.shiftY) >= labelHeight) continue;
        let upperAvailable = 0;
        // calculate available space above first element
        if (first.valueY > labelHeight) {
          if (i == 0) {
            upperAvailable = Math.min(labelHeight, first.valueY);
          } else if (first.valueY - data[i - 1].valueY + data[i - 1].shiftY > labelHeight) {
            upperAvailable = Math.min(labelHeight, first.valueY - data[i - 1].valueY + data[i - 1].shiftY);
          }
        }
        first.upperAvailable = upperAvailable;
        let underAvailable = 0;
        // calculate available space under second element
        if (second.valueY < height) {
          if (i == data.length - 2) {
            underAvailable = Math.min(labelHeight, height - second.valueY);
          } else if (data[i + 2].valueY - second.valueY > labelHeight) {
            underAvailable = Math.min(labelHeight, data[i + 2].valueY - second.valueY);
          }
        }
        second.underAvailable = underAvailable;
        const neededSpace = labelHeight - (second.valueY - first.valueY - first.shiftY);
        keys[first[KEY]] = {};
        keys[second[KEY]] = {};
        if (upperAvailable >= neededSpace / 2 && underAvailable >= neededSpace / 2) {
          first.shiftY = -neededSpace / 2;
          second.shiftY = neededSpace / 2;
        } else if (upperAvailable >= neededSpace / 2) {
          second.shiftY = underAvailable;
          first.shiftY = -Math.min(upperAvailable, neededSpace - underAvailable);
        } else if (underAvailable >= neededSpace / 2) {
          first.shiftY -= upperAvailable;
          second.shiftY = Math.min(underAvailable, neededSpace - upperAvailable);
        } else {
          first.shiftY = -upperAvailable;
          second.shiftY = underAvailable;
        }
        keys[first[KEY]].valueY = first.valueY + first.shiftY;
        keys[second[KEY]].valueY = second.valueY + second.shiftY;
      }
      g.each(function(d, i) {
        if (keys[d[KEY]] && keys[d[KEY]].valueY) {
          d3.select(this).selectAll(selector).transition().duration(DURATION).attr("transform", "translate(0," +
            keys[d[KEY]].valueY + ")");
        }
      });
    }

    // GETTERS AND SETTERS

    let selector = null;
    resolver.selector = function(arg) {
      if (!arguments.length)
        return selector;
      selector = arg;
      return resolver;
    };
    let height = null;
    resolver.height = function(arg) {
      if (!arguments.length)
        return height;
      height = arg;
      return resolver;
    };
    let scale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, 1]);
    resolver.scale = function(arg) {
      if (!arguments.length)
        return scale;
      scale = arg;
      return resolver;
    };
    let value = null;
    resolver.value = function(arg) {
      if (!arguments.length)
        return value;
      value = arg;
      return resolver;
    };
    let time = null;
    resolver.time = function(arg) {
      if (!arguments.length)
        return time;
      time = arg;
      return resolver;
    };
    let filter = function() { return true; };
    resolver.filter = function(arg) {
      if (!arguments.length)
        return filter;
      filter = arg;
      return resolver;
    };
    let fixed = null;
    resolver.fixed = function(arg) {
      if (!arguments.length)
        return fixed;
      fixed = arg;
      return resolver;
    };
    let handleResult = null;
    resolver.handleResult = function(arg) {
      if (!arguments.length)
        return handleResult;
      handleResult = arg;
      return resolver;
    };
    let KEY = null;
    resolver.KEY = function(arg) {
      if (!arguments.length)
        return KEY;
      KEY = arg;
      return resolver;
    };
    return resolver;
  })();
}
