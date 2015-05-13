define([
    'd3',
    'lodash',
    'models/hook'
], function(d3, _, Hook) {
    
    var palettes = {
        'geo.region':   {'asi':'#FF5872', 'eur':'#FFE700', 'ame':'#7FEB00', 'afr':'#00D5E9', '_default': '#ffb600'},
        'geo':          {'color1':'#F77481', 'color2':'#E1CE00', 'color3':'#B4DE79', 'color4':'#62CCE3'},
        'time':         {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79'},
        'lex':          {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79'},
        'gdp_per_cap':  {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79', "3":'#62CCE3'},
        'pop':          {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79'},
        '_default':     {'_default':'#fa5ed6'}
    };    
    var userSelectable = {
        'geo.region': false
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
            this.hasDefaultColor = false;
            
        },
        
        /**
         * Get the above constants
         */
        getPalettes: function(){
            return palettes;
        },       
        
        /**
         * Get the above constants
         */
        isUserSelectable: function(whichPalette){
            if(userSelectable[whichPalette]==null) return true;
            return userSelectable[whichPalette];
        },

        /**
         * Validates a color hook
         */
        validate: function() {
            this.scaleType = this.use=="indicator"?"linear":"ordinal";
            
            // first load and no palette supplied in the state
            // or changing of the indicator
            if(this.firstLoad || this.palette==null || !this.firstLoad && this.value_1 != this.value){
                
                //TODO a hack that prevents adding properties to palette (need replacing)
                this.set("palette", null, false);
                //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
                this.scale = null;
                if(palettes[this.value]){
                    this.palette = _.clone(palettes[this.value]);
                }else if(this.use == "value"){
                    this.palette = {"_default":this.value};
                }else{
                    this.palette = _.clone(palettes["_default"]);
                }
            }

            this.value_1 = this.value;
            this.firstLoad = false;
        },

        /**
         * set color
         */
        setColor: function(value, pointer) {
            var temp = this.palette.getObject();
            temp[pointer] = value;
            this.scale.range(_.values(temp));
            this.palette[pointer] = value;
        },

        
        /**
         * maps the value to this hook's specifications
         * @param value Original value
         * @returns hooked value
         */
        mapValue: function(value) {
            //if the property value does not exist, supply the _default 
            // otherwise the missing value would be added to the domain
            if(this.scale!=null 
               && this.use == "property" 
               && this.hasDefaultColor 
               && this.scale.domain().indexOf(value)==-1) value = "_default";
            return this._super(value);
        },
        
        
        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            var _this = this;
            
            var domain = _.keys(_this.palette.getObject());
            var range = _.values(_this.palette.getObject());
            
            this.hasDefaultColor = domain.indexOf("_default")>-1;

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
                    domain = d3.range(limits.min, limits.max, step).concat(limits.max);
                    
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













 