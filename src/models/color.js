define([
    'd3',
    'lodash',
    'models/hook'
], function(d3, _, Hook) {
    
    var availOpts = {
        'geo.region':   [{'asi':'#FF5872'}, {'eur':'#FFE700'}, {'ame':'#7FEB00'}, {'afr':'#00D5E9'}, {'_default': '#ffb600'}],
        'geo':          [{'color1':'#F77481'}, {'color2':'#E1CE00'}, {'color3':'#B4DE79'}, {'color4':'#62CCE3'}],
        'time':         [{'0':'#F77481'}, {"1":'#E1CE00'}, {"2":'#B4DE79'}],
        'lex':          [{'0':'#F77481'}, {"1":'#E1CE00'}, {"2":'#B4DE79'}],
        'gdp_per_cap':  [{'0':'#F77481'}, {"1":'#E1CE00'}, {"2":'#B4DE79'}, {"3":'#62CCE3'}],
        'pop':          [{'0':'#F77481'}, {"1":'#E1CE00'}, {"2":'#B4DE79'}],
        '_default':     [{'_default':'#fa5ed6'}]
    };

    var Color = Hook.extend({

        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "color";

            values = _.extend({
                use: "value",
                palette: null,
                value: undefined
            }, values);
            this._super(values, parent, bind);
            
            this.firstLoad = true;
        },
        
        /**
         * Get the above constants
         */
        getAvailOpts: function(){
            return availOpts;
        },

        /**
         * Validates a color hook
         */
        validate: function() {
            this.scaleType = this.use=="indicator"?"linear":"ordinal";
            
            if(this.firstLoad && this.palette==null || !this.firstLoad && this.value_1 != this.value){

                this.palette = null;
                if(availOpts[this.value]){
                    this.palette = _.clone(availOpts[this.value]);
                }else{
                    this.palette = _.clone(availOpts["_default"]);
                }
            }

            this.value_1 = this.value;
            this.firstLoad = false;
        },

        /**
         * set color
         */
        setColor: function(value, pointer) {
//            if(pointer==null){
//                if(this.use=="indicator")
//                pointer = 
//                    }
            
        },

        
        /**
         * maps the value to this hook's specifications
         * @param value Original value
         * @returns hooked value
         */
        mapValue: function(value) {
            //if the property value does not exist, supply the _default 
            // otherwise the missing value would be added to the domain
            if(this.use == "property" && this.scale.domain().indexOf(value)==-1) value = "_default";
            return this._super(value);
        },
        
        
        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            var _this = this;
            
            var domain = _this.palette.map(function(d){return _.keys(d)[0]});
            var range = _this.palette.map(function(d){return _.values(d)[0]});

            if(this.value=="time"){
                var limits = this.getLimits(this.value);
                this.scale = d3.time.scale()
                    .domain([limits.min, limits.max])
                    .range(range);
                return;
            }
            
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.value);
                    var step = ((limits.max-limits.min) / (range.length - 1));
                    domain = d3.range(limits.min, limits.max, step).concat(max);
                    
                    this.scale = d3.scale["linear"]()
                        .domain(domain)
                        .range(range)
                        .interpolate(d3.interpolateRgb);
                    return;

                default:
                    this.scale = d3.scale["ordinal"]()
                        .domain(domain)
                        .range(range);
                    return;
            }
        }

    });

    return Color;
});













 