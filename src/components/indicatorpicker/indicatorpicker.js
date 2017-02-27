import * as utils from "base/utils";
import Component from "base/component";

import {
  question as iconQuestion
} from "base/iconset";

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

const IndPicker = Component.extend({

    /**
     * Initializes the Indicator Picker.
     * Executed once before any template is rendered.
     * @param config The options passed to the component
     * @param context The component's parent
     */
  init(config, context) {

    this.name = "gapminder-indicatorpicker";
    this.template = '<span class="vzb-ip-holder"><span class="vzb-ip-select"></span><span class="vzb-ip-info"></span></span>';

    const _this = this;

    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }];

    this.markerID = config.markerID;
    this.showHoverValues = config.showHoverValues || false;
    if (!config.markerID) utils.warn("indicatorpicker.js complains on 'markerID' property: " + config.markerID);

    this.model_binds = {
      "translate:locale": function(evt) {
        _this.updateView();
      },
      "ready": function(evt) {
        _this.updateView();
      }
    };

    if (this.markerID) {
      this.model_binds["change:marker." + this.markerID + ".which"] = function(evt) {
        _this.updateView();
      };
    }

    if (this.showHoverValues) {
      this.model_binds["change:marker.highlight"] = function(evt, values) {
        const mdl = _this.model.marker[_this.markerID];
        if (!_this.showHoverValues || mdl.use == "constant") return;
        const _highlightedEntity = _this.model.marker.getHighlighted();
        if (_highlightedEntity.length > 1) return;

        if (_highlightedEntity.length) {
          _this.model.marker.getFrame(_this.model.time.value, frame => {
            if (_this._highlighted || !frame) return;

                        // should be replaced by dimension of entity set for this hook (if use == property)
            const dimension = _this.model.entities.getDimension();
            const _highlightedEntity = _this.model.marker.getHighlighted(dimension);
            if (_highlightedEntity.length) {

              let value = frame[_this.markerID][_highlightedEntity[0]];

                            // resolve strings via the color legend model
              if (value && mdl._type === "color" && mdl.isDiscrete()) {
                const clModel = mdl.getColorlegendMarker();
                if (clModel.label.getItems()[value]) value = clModel.label.getItems()[value];
              }

              _this._highlightedValue = value;

              _this._highlighted = (!_this._highlightedValue && _this._highlightedValue !== 0) || mdl.use !== "constant";
              _this.updateView();
            }
          });
        } else {
          if (values !== null && values !== "highlight") {
            if (values) {
              _this._highlightedValue = values[_this.markerID];
              _this._highlighted = (!_this._highlightedValue && _this._highlightedValue !== 0) || mdl.use !== "constant";
            }
          } else {
            _this._highlighted = false;
          }
          _this.updateView();
        }
      };
    }

        //contructor is the same as any component
    this._super(config, context);
  },

  ready() {
    this.updateView();
  },


  readyOnce() {
    const _this = this;

    this.el_select = d3.select(this.element).select(".vzb-ip-select");

    this.el_select.on("click", () => {
      const rect = _this.el_select.node().getBoundingClientRect();
      const rootEl = _this.root.element instanceof Array ? _this.root.element : d3.select(_this.root.element);
      const rootRect = rootEl.node().getBoundingClientRect();
      const treemenuComp = _this.root.findChildByName("gapminder-treemenu");
      const treemenuColWidth = treemenuComp.activeProfile.col_width;
      const treemenuPaddLeft = parseInt(treemenuComp.wrapper.style("padding-left"), 10) || 0;
      const treemenuPaddRight = parseInt(treemenuComp.wrapper.style("padding-right"), 10) || 0;
      const topPos = rect.bottom - rootRect.top;
      const leftPos = rect.left - rootRect.left - (treemenuPaddLeft + treemenuPaddRight + treemenuColWidth - rect.width) * 0.5;

      treemenuComp
        .markerID(_this.markerID)
        .alignX("left")
        .alignY("top")
        .top(topPos)
        .left(leftPos)
        .updateView()
        .toggle();
    });

    this.infoEl = d3.select(this.element).select(".vzb-ip-info");
    utils.setIcon(this.infoEl, iconQuestion)
      .select("svg").attr("width", "0px").attr("height", "0px");

    this.infoEl.on("click", () => {
      _this.root.findChildByName("gapminder-datanotes").pin();
    });
    this.infoEl.on("mouseover", () => {
      const rect = _this.el_select.node().getBoundingClientRect();
      const rootRect = _this.root.element.getBoundingClientRect();
      const topPos = rect.bottom - rootRect.top;
      const leftPos = rect.left - rootRect.left + rect.width;

      _this.root.findChildByName("gapminder-datanotes").setHook(_this.markerID).show().setPos(leftPos, topPos);
    });
    this.infoEl.on("mouseout", () => {
      _this.root.findChildByName("gapminder-datanotes").hide();
    });


  },


  updateView() {
    if (!this._readyOnce) return;

    const _this = this;
    const translator = this.model.locale.getTFunction();

    const which = this.model.marker[this.markerID].which;
    const type = this.model.marker[this.markerID]._type;
    const concept = this.model.marker[this.markerID].getConceptprops();

    let selectText;

    if (this.showHoverValues && this._highlighted) {
      const unit = !concept.unit ? "" : " " + concept.unit;
      const formatter = _this.model.marker[this.markerID].getTickFormatter();

      selectText = (this._highlightedValue || this._highlightedValue === 0) ? formatter(this._highlightedValue) + unit : translator("hints/nodata");

    } else {
            //Let the indicator "_default" in tree menu be translated differnetly for every hook type
      selectText = (which === "_default") ? translator("indicator/_default/" + type) : concept.name;
    }

    this.el_select.text(selectText);

        // hide info el if no data is available for it to make sense
    const hideInfoEl = !concept.description && !concept.sourceName && !concept.sourceLink;
    this.infoEl.classed("vzb-hidden", hideInfoEl);
  }

});

export default IndPicker;
