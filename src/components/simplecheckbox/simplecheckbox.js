import Component from "base/component";

export default Component.extend({

  init(config, context) {
    this.template =
      '<span class="vzb-sc-holder vzb-dialog-checkbox"><input type="checkbox"><label></label></span>';
    const _this = this;
    this.name = "gapminder-simplecheckbox";

    this.checkbox = config.checkbox;
    this.submodel = config.submodel;

    this.model_expects = [{
      name: "mdl"
        //TODO: learn how to expect model "axis" or "size" or "color"
    }, {
      name: "locale",
      type: "locale"
    }];


    this.model_binds = {
      "change:mdl": function(evt) {
        _this.updateView();
      },
      "translate:locale": function(evt) {
        _this.updateView();
      }
    };

    const submodel = (this.submodel) ? this.submodel + ":" : "";
    this.model_binds["change:mdl." + submodel + this.checkbox] = function() {
      _this.updateView();
    };

    //contructor is the same as any component
    this._super(config, context);
  },

  ready() {
    this.parentModel = (this.submodel) ? this.model.mdl[this.submodel] : this.model.mdl;
    this.updateView();
  },

  readyOnce() {
    const _this = this;
    this.element = d3.select(this.element);
    const id = "-check-" + _this._id;
    this.labelEl = this.element.select("label").attr("for", id);
    this.checkEl = this.element.select("input").attr("id", id)
      .on("change", function() {
        _this._setModel(d3.select(this).property("checked"));
      });
  },

  updateView() {
    this.translator = this.model.locale.getTFunction();
    this.labelEl.text(this.translator("check/" + this.checkbox));
    this.checkEl.property("checked", !!this.parentModel[this.checkbox]);
  },

  _setModel(value) {
    this.parentModel[this.checkbox] = value;
  }

});
