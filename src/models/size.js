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

  buildScale: function(margins){
    //do whatever axis.buildScale does
    this._super(margins);
    //but then also clamp a numeric scale
    if(this.scaleType !== 'ordinal') this.scale.clamp(true);

    if(this.use == 'indicator' && this.domainMin == null && this.domainMax == null) {
      var domain = this.scale.domain();
      this.set({domainMin: domain[0], domainMax: domain[1]});
    }
  }
});

export default SizeModel;
