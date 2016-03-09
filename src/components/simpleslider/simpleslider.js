import Component from 'base/component';
import * as utils from 'base/utils';

/*!
 * VIZABI GENERIC SLIDER CONTROL
 * Reusable SLIDER
 */

var SimpleSlider = Component.extend({

    init: function (config, context) {
      this.template = '<div class="vzb-ss-holder"><input type="range" id="vzb-ss-slider" class="vzb-ss-slider" step="1"></div>';

      this.model_expects = [{
        name: "submodel"
      }];

      var _this = this;
      this.name = 'gapminder-simpleSlider';

      this.arg = config.arg;
      this.thumb_size = config.thumb_size;
      this.slider_properties = config.properties;

      this.model_binds = {};
      this.model_binds["change:submodel." + this.arg] = function (evt) {
        _this.updateView();
      };

      //contructor is the same as any component
      this._super(config, context);
        
      this._setModel = utils.throttle(this._setModel, 50);
    },

    /**
     * Executes after the template is loaded and rendered.
     * Ideally, it contains HTML instantiations related to template
     * At this point, this.element and this.placeholder are available as a d3 object
     */
    readyOnce: function () {

      //default values
      var min = 0;
      var max = 1;
      var step = 0.1;
      var value = min;

      //selecting elements
      var _this = this;
      this.element = d3.select(this.element);
      this.slider = this.element.selectAll('#vzb-ss-slider');

      this.elementSize = this.element.node().getBoundingClientRect();
      this.sliderSize = this.slider.node().getBoundingClientRect();
      this.slider.style('left', (this.elementSize.left - this.sliderSize.left) + 'px');

      //TODO: replace this with utils.extend
      if(this.slider_properties){
        if(this.slider_properties.min != null) min = this.slider_properties.min;
        if(this.slider_properties.max != null) max = this.slider_properties.max;
        if(this.slider_properties.step != null) step = this.slider_properties.step;

        if(this.slider_properties.scale){
          value = this.slider_properties.scale(min);
        }
      }
        
      //step also defines the rounding of values that willbe sent to model: 0.1 --> 1 digit, 0.01 --> 2, 1 and up --> 0
      this.roundTo = step > 1 ? 0 : Math.round(Math.abs(Math.log(step)/Math.LN10));

      //check and change the slider's thumb size
      if(this.thumb_size){
        this.slider.classed('vzb-ss-slider', false);
        this.slider.classed('vzb-ss-slider-'+this.thumb_size, true);
      }

      this.slider
        .attr('min', min)
        .attr('max', max)
        .attr('step', step)
        .attr('value', value)
        .on('input', function () {
          var value = +d3.event.target.value;
          _this._setModel(value, false, false); // on drag - non-persistent changes while dragging
        })
        .on('change', function() {
          var value = +d3.event.target.value;
          _this._setModel(value, true); // on drag end - value is probably same as last 'input'-event, so force change
        });

      this.updateView();
    },

    updateView: function () {
      var value = this.model.submodel[this.arg];
      var slider_properties = this.slider_properties;
      var scale;

      if(slider_properties){
        scale = slider_properties.scale;
      }
      if (scale){
        value = scale.invert(value);
      }

      //this.slider.attr('value', value);
      this.slider.node().value = value;
    },

    _setModel: function (value, force, persistent) {
      // rescale value if scale is supplied in slider_properties 
      if(this.slider_properties && this.slider_properties.scale) value = this.slider_properties.scale(value);
      
      this.model.submodel.getModelObject(this.arg).set(value.toFixed(this.roundTo), force, persistent);
    }

  });

export default SimpleSlider;
