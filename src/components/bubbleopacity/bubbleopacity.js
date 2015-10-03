import Component from 'base/component';
/*!
 * VIZABI BUBBLE OPACITY CONTROL
 * Reusable OPACITY SLIDER
 */

var BubbleOpacity = Component.extend({

    init: function (config, context) {
      this.template = '<div class="vzb-bo-holder"><input type="range" id="vzb-bo-slider" class="vzb-bo-slider" step="1"></div>';

      this.model_expects = [{
        name: "entities",
        type: "entities"
      }];

      var _this = this;

      this.arg = config.arg;

      this.model_binds = {
        "change:entities:select": function (evt) {
          _this.updateView();
        }
      }
      this.model_binds["change:entities:" + this.arg] = function (evt) {
        _this.updateView();
      }


      //contructor is the same as any component
      this._super(config, context);
    },

    /**
     * Executes after the template is loaded and rendered.
     * Ideally, it contains HTML instantiations related to template
     * At this point, this.element and this.placeholder are available as a d3 object
     */
    readyOnce: function () {
      var _this = this;
      this.element = d3.select(this.element);
      this.slider = this.element.selectAll('#vzb-bo-slider');

      this.elementSize = this.element.node().getBoundingClientRect();
      this.sliderSize = this.slider.node().getBoundingClientRect();
      this.slider.style('left', (this.elementSize.left - this.sliderSize.left) + 'px');

      this.slider
        .attr('min', 0)
        .attr('max', 1)
        .attr('step', 0.1)
        .on('input', function () {
          _this._setModel();
        });

      this.updateView();
    },

    updateView: function () {
      var someSelected = this.model.entities.select.length;
      var value = this.model.entities[this.arg];

      this.slider.attr('value', value);
    },

    _setModel: function () {
      this.model.entities[this.arg] = +d3.event.target.value;
    }

  });

export default BubbleOpacity;
