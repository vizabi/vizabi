import Axis from 'models/axis';

/*
 * VIZABI Size Model
 */

var SizeModel = Axis.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: "constant",
    which: "_default",
    domainMin: null,
    domainMax: null,
    zoomedMin: null,
    zoomedMax: null,
    extent: [0, 0.85],
    scaleType: "ordinal",
    allow: {
      scales: ["linear", "log", "genericLog", "pow"]
    }
  },

  _type: "size",

  buildScale: function(){
    //do whatever axis.buildScale does
    this._super();
    //but then also clamp a numeric scale
    if(this.scaleType !== 'ordinal') this.scale.clamp(true);
    
  }
});

export default SizeModel;
