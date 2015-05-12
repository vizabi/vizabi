define([
    'd3',
    'lodash',
    'models/hook'
], function(d3, _, Hook) {
    
    var availOpts = {
        'geo.region':   {'asi':'#FF5872', 'eur':'#FFE700', 'ame':'#7FEB00', 'afr':'#00D5E9', '_default': '#ffb600'},
        'geo':          {'color1':'#F77481', 'color2':'#E1CE00', 'color3':'#B4DE79', 'color4':'#62CCE3'},
        'time':         ['#F77481', '#E1CE00', '#B4DE79'],
        'lex':          ['#F77481', '#E1CE00', '#B4DE79'],
        'gdp_per_cap':  ['#F77481', '#E1CE00', '#B4DE79', '#62CCE3'],
        'pop':          ['#F77481', '#E1CE00', '#B4DE79'],
        '_default':     {'_default':'#fa5ed6'}
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
            this.scale = this.use=="indicator"?"linear":"ordinal";
            
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
            if(this.use == "property" && !this.palette[value]) value = "_default";
            return this._super(value);
        },
        
        
        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        getDomain: function() {
            var _this = this;
            

            if(this.value=="time"){
                var limits = this.getLimits(this.value);
                return d3.time.scale()
                    .domain([limits.min, limits.max])
                    .range(_this.palette);
            }
            
            switch (this.use) {
                case "indicator":
                    var range = _this.palette;
                    
                    var limits = this.getLimits(this.value);
                    var min = parseFloat(limits.min);
                    var max = parseFloat(limits.max);
                    var step = ((max-min) / (range.length - 1));
                    var domain = d3.range(min, max, step).concat(max);
                    
                    return d3.scale["linear"]()
                        .domain(domain)
                        .range(range)
                        .interpolate(d3.interpolateRgb);

                default:
                    var domain = _.keys(_this.palette);
                    var range = _.values(_this.palette);
                    return d3.scale["ordinal"]()
                        .domain(domain)
                        .range(range);
            }
        }

    });

    return Color;
});













 