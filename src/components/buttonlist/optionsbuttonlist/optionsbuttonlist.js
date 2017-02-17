import * as utils from "base/utils";
import ButtonList from "components/buttonlist/buttonlist";
import * as iconset from "base/iconset";

/*!
 * VIZABI OPTIONSBUTTONLIST
 * Reusable optionsbuttonlist component
 */

//default existing buttons
const class_active = "vzb-active";
// var class_active_locked = "vzb-active-locked";
// var class_expand_dialog = "vzb-dialog-side";
// var class_hide_btn = "vzb-dialog-side-btn";
// var class_unavailable = "vzb-unavailable";
// var class_vzb_fullscreen = "vzb-force-fullscreen";
// var class_container_fullscreen = "vzb-container-fullscreen";

const OptionsButtonList = ButtonList.extend({

  /**
   * Initializes the buttonlist
   * @param config component configuration
   * @param context component context (parent)
   */
  init(config, context) {

    //set properties
    const _this = this;
    this.name = "gapminder-optionsbuttonlist";

    this._super(config, context);
  },

  readyOnce() {
    const _this = this;
    Object.keys(this._available_buttons).forEach(buttonId => {
      const button = _this._available_buttons[buttonId];
      button.required = !button.required;
    });

    this.buttonListComp = this.root.findChildByName("gapminder-buttonlist");

    this.buttonListComp.on("click", (evt, button) => {
      const btn = _this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + button.id + "']");
      btn.classed(class_active, button.active);
    });

    this.buttonListComp.on("toggle", (evt, params) => {
      const btn = _this.element.selectAll(".vzb-buttonlist-btn");
      let visibleButton = 0;
      btn.each(function(d) {
        const button = d3.select(this);
        const isHidden = params.hiddenButtons.indexOf(d.id) == -1;
        button.style("display", isHidden ? "none" : "");
        if (!isHidden) visibleButton++;
      });
    });

    this._super();
  },

  proceedClick(id) {
    const _this = this;
    this.buttonListComp.proceedClick(id);
    const btn_data = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']").datum();
    if (btn_data.func) {
      setTimeout(() => {
        _this.root.findChildByName("gapminder-dialogs").closeAllDialogs();
      }, 200);
    }
  },

  _toggleButtons() {
    //
  }

});

export default OptionsButtonList;
