import * as utils from 'base/utils';
import ButtonList from 'components/buttonlist/buttonlist';
import * as iconset from 'base/iconset';

/*!
 * VIZABI OPTIONSBUTTONLIST
 * Reusable optionsbuttonlist component
 */

//default existing buttons
var class_active = "vzb-active";
// var class_active_locked = "vzb-active-locked";
// var class_expand_dialog = "vzb-dialog-side";
// var class_hide_btn = "vzb-dialog-side-btn";
// var class_unavailable = "vzb-unavailable";
// var class_vzb_fullscreen = "vzb-force-fullscreen";
// var class_container_fullscreen = "vzb-container-fullscreen";

var OptionsButtonList = ButtonList.extend({

  /**
   * Initializes the buttonlist
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, context) {

    //set properties
    var _this = this;
    this.name = 'gapminder-optionsbuttonlist';

    this._super(config, context);
  },

  readyOnce: function() {
    var _this = this;
    Object.keys(this._available_buttons).forEach(function(buttonId) {
      var button = _this._available_buttons[buttonId];
      button.required = !button.required;
    });

    this.buttonListComp = this.root.findChildByName("gapminder-buttonlist");

    this.buttonListComp.on("click", function(evt, button) {
      var btn = _this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + button.id + "']");
      btn.classed(class_active, button.active);
    });

    this.buttonListComp.on("toggle", function(evt, params) {
      var btn = _this.element.selectAll(".vzb-buttonlist-btn");
      var visibleButton = 0;
      btn.each(function(d) {
        var button = d3.select(this);
        var isHidden = params.hiddenButtons.indexOf(d.id) == -1;
        button.style('display', isHidden ? 'none' : '');
        if(!isHidden) visibleButton++;
      });
    });

    this._super();
  },

  proceedClick: function(id) {
    var _this = this;
    this.buttonListComp.proceedClick(id);
    var btn_data = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']").datum();
    if(btn_data.func) {
      setTimeout(function() {
        _this.root.findChildByName("gapminder-dialogs").closeAllDialogs();
      }, 200);
    }
  },

  _toggleButtons: function() {
    //
  }

});

export default OptionsButtonList;
