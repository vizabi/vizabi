import Component from 'base/component';

export default Component.extend({

  init: function(config, context) {
    this.template =
      '<span class="vzb-sc-holder vzb-dialog-checkbox"><input type="checkbox"><label></label></span>';
    var _this = this;

    this.checkbox = config.checkbox;
    this.submodel = config.submodel;

    this.model_expects = [{
      name: "mdl"
        //TODO: learn how to expect model "axis" or "size" or "color"
    }, {
      name: "language",
      type: "language"
    }];


    this.model_binds = {
      "change:mdl": function(evt) {
        _this.updateView();
      },
      "change:language": function(evt) {
        _this.updateView();
      }
    };

    var submodel = (this.submodel) ? this.submodel + ':' : '';
    this.model_binds["change:mdl:" + submodel + this.checkbox] = function() {
      _this.updateView();
    };

    //contructor is the same as any component
    this._super(config, context);
  },

  ready: function() {
    this.updateView();
  },

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);
    var id = "-check-" + Math.random() * 1000;
    this.labelEl = this.element.select('label').attr("for", id);
    this.checkEl = this.element.select('input').attr("id", id)
      .on("change", function() {
        _this._setModel(d3.select(this).property("checked"));
      });
  },

  updateView: function() {
    console.log('hi');
    this.translator = this.model.language.getTFunction();
    this.labelEl.text(this.translator("check/" + this.checkbox));
    var value = (this.submodel) ? this.model.mdl[this.submodel][this.checkbox] : this.model.mdl[this.checkbox];
    this.checkEl.property("checked", !!value);
  },

  _setModel: function(value) {
    if (this.submodel) {
      this.model.mdl[this.submodel][this.checkbox] = value;
    } else {
      this.model.mdl[this.checkbox] = value;
    }
  }

});