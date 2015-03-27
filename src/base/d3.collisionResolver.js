define(['d3'], function(d3){

    d3.svg.collisionResolver = function(){
        
    return function collision_resolver() {

        var DURATION = 300;
        var labelHeight = {};
        var labelPosition = {};

        
        // MAINN FUNCTION. RUN COLLISION RESOLVER ON A GROUP g
        function resolver(g) {
            
            if(data == null){console.warn(
                "D3 collision resolver stopped: missing data to work with. Example: data = {asi: {valueY: 45, valueX: 87}, ame: {valueY: 987, valueX: 767}}"); return;}
            if(selector == null){console.warn(
                "D3 collision resolver stopped: missing a CSS slector"); return;}
            if(height == null){console.warn(
                "D3 collision resolver stopped: missing height of the canvas"); return;}
            if(value == null){console.warn(
                "D3 collision resolver stopped: missing pointer within data objects. Example: value = 'valueY' "); return;}
            if(scale == null){console.warn(
                "D3 collision resolver stopped: missing scaling function. Example: scale = function(x){return ax+b} "); return;}
                        
            g.each(function(d, index) {
                labelHeight[d.geo] = d3.select(this).select(selector)[0][0].getBBox().height;
            });

            labelPosition = resolver.calculatePositions(data, value, height, scale);
 
            //actually reposition the labels
            g.each(function (d, i) {
                
                var resolvedY = labelPosition[d.geo] || scale(data[d.geo][value]) || 0;
                var resolvedX = null;
                
                if(handleResult!=null) {handleResult(d, i, this, resolvedX, resolvedY); return;}
                
                d3.select(this).selectAll(selector)
                    .transition()
                    .duration(DURATION)
                    .attr("transform", "translate(0," + resolvedY + ")")
            });

   
        };
        
        
        
                
        // CALCULATE OPTIMIZED POSITIONS BASED ON LABELS' HEIGHT AND THEIR PROXIMITY (DELTA)
            
        resolver.calculatePositions = function(data, value, height, scale){
            
            var result = {};
                        
            var keys = Object.keys(data).sort(function(a,b){return data[a][value] - data[b][value]});
                            
            keys.forEach(function(d, index){

                //initial positioning
                result[d] = scale(data[d][value]);

                // check the overlapping chain reaction all the way down 
                for(var j = index; j>0; j--){
                    // if overlap found shift the overlapped label downwards
                    var delta = result[keys[j-1]] - result[keys[j]] - labelHeight[keys[j]];
                    if(delta<0) result[keys[j-1]] -= delta;

                    // if the chain reaction stopped because found some gap in the middle, then quit
                    if(delta>0) break;
                }

            })
                
                
            // check if the lowest label is breaking the boundary...
            var delta = height - result[keys[0]] - labelHeight[keys[0]];

            // if it does, then                
            if(delta<0){
                // shift the lowest up
                result[keys[0]] += delta;

                // check the overlapping chain reaction all the way up 
                for(var j = 0; j<keys.length-1; j++){
                    // if overlap found shift the overlapped label upwards
                    var delta = result[keys[j]] - result[keys[j+1]] - labelHeight[keys[j+1]];
                    if(delta<0) result[keys[j+1]] += delta;

                    // if the chain reaction stopped because found some gap in the middle, then quit
                    if(delta>0) break;
                }
            }
            
            

            return result;
        };
        
        
        
        
        // GETTERS AND SETTERS
        
        var data = null;
        resolver.data = function(arg) {
            if (!arguments.length) return data;
            data = arg;
            return resolver;
        };
        var selector = null;
        resolver.selector = function(arg) {
            if (!arguments.length) return selector;
            selector = arg;
            return resolver;
        };
        var height = null;
        resolver.height = function(arg) {
            if (!arguments.length) return height;
            height = arg;
            return resolver;
        };
        var scale = null;
        resolver.scale = function(arg) {
            if (!arguments.length) return scale;
            scale = arg;
            return resolver;
        };
        var value = null;
        resolver.value = function(arg) {
            if (!arguments.length) return value;
            value = arg;
            return resolver;
        };
        var handleResult = null;
        resolver.handleResult = function(arg) {
            if (!arguments.length) return handleResult;
            handleResult = arg;
            return resolver;
        };
        

        return resolver;
        
    }();
        
    }; //d3.svg.collisionResolver = function(){

}); //define(['d3'], function(d3){

