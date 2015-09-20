/*
 * Axes dialog
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');


  Vizabi.Component.register('gapminder-buttonlist-axes-mc', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'axes-mc';
    var _this = this;

        this.model_binds = {
            'change:state:time:xLogStops': function () {
                _this.updateView();
            },
            'change:state:time:yMaxMethod': function () {
                _this.updateView();
            },
            'change:state:time:povertyline': function () {
                _this.updateView();
            }
        };

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-xlimits-container',
        model: ["state.marker.axis_x", "language"],
        ui: {selectIndicator: false, selectScaletype: false, selectMinMax: true}
      }]


      this._super(config, parent);
    },

    readyOnce: function(){
        var _this = this;
        this.element = d3.select(this.element);

        this.yMaxRadio = this.element.select('.vzb-yaxis-container').selectAll('input')
            .on("change", function(){
                _this.setModel("yMaxMethod", d3.select(this).node().value);
            })

        this.xLogStops = this.element.select('.vzb-xaxis-container').selectAll('input')
            .on("change", function(){
                _this.setModel("xLogStops", d3.select(this).node().value);
            })

        this.povertyLineFieldEl = this.element.select(".vzb-povertyline-field")
            .on("change", function(){
                var result = parseFloat(this.value.replace(",","."));
                if(result <= _this.model.state.time.povertyCutoff) {
                    this.value = _this.model.state.time.povertyline;
                    return;
                }
                _this.setModel("povertyline", result);
            });
        
        this.updateView();

        this._super();
    },

    updateView: function(){
        var _this = this;

        this.yMaxRadio.property('checked', function(){
            return d3.select(this).node().value === _this.model.state.time.yMaxMethod;
        })
        this.xLogStops.property('checked', function(){
            return _this.model.state.time.xLogStops.indexOf(+d3.select(this).node().value) !== -1;
        })  
        this.povertyLineFieldEl.property("value", this.model.state.time.povertyline);
    },

    setModel: function(what, value) {
        var result;

        if(what == "yMaxMethod"){
            result = value;
        }
        if(what == "xLogStops"){
            result = [];
            this.xLogStops.each(function(){
                if(d3.select(this).property('checked')) result.push(+d3.select(this).node().value);
            })
        }
        if(what == "povertyline"){
            result = value;
        }
        
        this.model.state.time[what] = result;
    }
  }));

}).call(this);

