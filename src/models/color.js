/*!
 * VIZABI Color Model (hook)
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }
    
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

    Vizabi.Model.extend('color', {

        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "color";

            values = utils.extend({
                use: "value",
                unit: "",
                palette: null,
                which: undefined
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
            var possibleScales = ["log", "genericLog", "linear", "time", "pow"];
            if (!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
                this.scaleType = 'linear'; 
            }
            if (this.use !== "indicator" && this.scaleType !== "ordinal") {
                this.scaleType = "ordinal";
            }
            
            // reset palette in the following cases:
            // first load and no palette supplied in the state
            // or changing of the indicator
            if(this.palette==null 
               || this.firstLoad===false && this.which_1 != this.which 
               || this.firstLoad===false && this.scaleType_1 != this.scaleType){
                
                //TODO a hack that prevents adding properties to palette (need replacing)
                this.set("palette", null, false);
                //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
                this.scale = null;
                if(palettes[this.which]){
                    this.palette = utils.clone(palettes[this.which]);
                }else if(this.use == "value"){
                    this.palette = {"_default":this.which};
                }else{
                    this.palette = utils.clone(palettes["_default"]);
                }
            }

            this.which_1 = this.which;
            this.scaleType_1 = this.scaleType;
            this.firstLoad = false;
        },

        /**
         * set color
         */
        setColor: function(value, pointer) {
            var temp = this.palette.getObject();
            temp[pointer] = value;
            this.scale.range(utils.values(temp));
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
            
            var domain = Object.keys(_this.palette.getObject());
            var range = utils.values(_this.palette.getObject());
            
            this.hasDefaultColor = domain.indexOf("_default")>-1;

            if(this.scaleType=="time"){
                var limits = this.getLimits(this.which);
                this.scale = d3.time.scale()
                    .domain([limits.min, limits.max])
                    .range(range);
                return;
            }
            
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.which);
                    var step = ((limits.max-limits.min) / (range.length - 1));
                    domain = d3.range(limits.min, limits.max, step).concat(limits.max);
                    
                    if(this.scaleType=="log"){
                        var s = d3.scale.log().domain([limits.min, limits.max]).range([limits.min, limits.max]);
                        domain = domain.map(function(d){return s.invert(d)});
                    }
                    
                    this.scale = d3.scale[this.scaleType]()
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

}).call(this);












 