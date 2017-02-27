//d3.svg.collisionResolver

export default function collisionResolver() {
  return (function collision_resolver() {
    const DURATION = 300;
    const labelHeight = {};
    let labelPosition = {};
    // MAINN FUNCTION. RUN COLLISION RESOLVER ON A GROUP g
    function resolver(g) {
      if (data == null) {
        console.warn(
          "D3 collision resolver stopped: missing data to work with. Example: data = {asi: {valueY: 45, valueX: 87}, ame: {valueY: 987, valueX: 767}}"
        );
        return;
      }
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
      g.each(function(d, index) {
        labelHeight[d[KEY]] = d3.select(this).select(selector).node().getBBox().height;
      });
      labelPosition = resolver.calculatePositions(data, value, height, scale);
      //actually reposition the labels
      g.each(function(d, i) {
        if ((!data[d[KEY]]) || data[d[KEY]][fixed])
          return;
        const resolvedY = labelPosition[d[KEY]] || scale(data[d[KEY]][value]) || 0;
        const resolvedX = null;
        if (handleResult != null) {
          handleResult(d, i, this, resolvedX, resolvedY);
          return;
        }
        d3.select(this).selectAll(selector).transition().duration(DURATION).attr("transform", "translate(0," +
          resolvedY + ")");
      });
    }

    // CALCULATE OPTIMIZED POSITIONS BASED ON LABELS' HEIGHT AND THEIR PROXIMITY (DELTA)
    resolver.calculatePositions = function(data, value, height, scale) {
      const result = {};
      const keys = Object.keys(data).sort((a, b) => data[a][value] - data[b][value]);
      keys.forEach((d, index) => {
        //initial positioning
        result[d] = scale(data[d][value]);
        // check the overlapping chain reaction all the way down
        for (let j = index; j > 0; j--) {
          // if overlap found shift the overlapped label downwards
          const delta = result[keys[j - 1]] - result[keys[j]] - labelHeight[keys[j]];
          if (delta < 0)
            result[keys[j - 1]] -= delta;
          // if the chain reaction stopped because found some gap in the middle, then quit
          if (delta > 0)
            break;
        }
      });
      // check if the lowest label is breaking the boundary...
      let delta = height - result[keys[0]] - labelHeight[keys[0]];
      // if it does, then
      if (delta < 0) {
        // shift the lowest up
        result[keys[0]] += delta;
        // check the overlapping chain reaction all the way up
        for (let j = 0; j < keys.length - 1; j++) {
          // if overlap found shift the overlapped label upwards
          delta = result[keys[j]] - result[keys[j + 1]] - labelHeight[keys[j + 1]];
          if (delta < 0)
            result[keys[j + 1]] += delta;
          // if the chain reaction stopped because found some gap in the middle, then quit
          if (delta > 0)
            break;
        }
      }
      return result;
    };
    // GETTERS AND SETTERS
    let data = null;
    resolver.data = function(arg) {
      if (!arguments.length)
        return data;
      data = arg;
      return resolver;
    };
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
    let scale = d3.scale.linear()
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
