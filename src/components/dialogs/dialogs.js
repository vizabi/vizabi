import requireAll from "helpers/requireAll";
import * as utils from "base/utils";
import Component from "base/component";
import * as iconset from "base/iconset";

//dialogs
const dialogs = requireAll(require.context("../../components/dialogs", true, /\.js$/), 1);

/*!
 * VIZABI DIALOGS
 * Reusable dialogs component
 */

//default existing dialogs
const class_active = "vzb-active";
const class_expand_dialog = "vzb-dialog-side";

const Dialogs = Component.extend({

  /**
   * Initializes the dialogs
   * @param config component configuration
   * @param context component context (parent)
   */
  init(config, context) {

    //set properties
    const _this = this;
    this.name = "gapminder-dialogs";
    this._curr_dialog_index = 20;


    this.model_expects = [{
      name: "state",
      type: "model"
    }, {
      name: "ui",
      type: "ui"
    }, {
      name: "locale",
      type: "locale"
    }];

    this._available_dialogs = {
      "timedisplay": {
        dialog: dialogs.timedisplay
      },
      "find": {
        dialog: dialogs.find,
      },
      "show": {
        dialog: dialogs.show,
      },
      "moreoptions": {
        dialog: dialogs.moreoptions,
      },
      "colors": {
        dialog: dialogs.colors,
      },
      "size": {
        dialog: dialogs.size,
      },
      "side": {
        dialog: dialogs.side,
      },
      "label": {
        dialog: dialogs.label,
      },
      "zoom": {
        dialog: dialogs.zoom,
      },
      "axes": {
        dialog: dialogs.axes,
      },
      "axesmc": {
        dialog: dialogs.axesmc,
      },
      "stack": {
        dialog: dialogs.stack,
      },
      "speed": {
        dialog: dialogs.speed
      },
      "opacity": {
        dialog: dialogs.opacity
      },
      "presentation": {
        dialog: dialogs.presentation
      },
      "about": {
        dialog: dialogs.about
      },
      "mapoptions": {
        dialog: dialogs.mapoptions
      }
    };

    this._super(config, context);

  },

  domReady() {
    const dialog_popup = (this.model.ui.dialogs || {}).popup || [];
    let dialog_sidebar = (this.model.ui.dialogs || {}).sidebar || [];

    this.rootEl = this.root.element instanceof Array ? this.root.element : d3.select(this.root.element);

    // if dialog_sidebar has been passed in with boolean param or array must check and covert to array
    if (dialog_sidebar === true) {
      dialog_sidebar = dialog_popup;
      (this.model.ui.dialogs || {}).sidebar = dialog_sidebar;
    }
    if (dialog_sidebar.length !== 0) {
      this.rootEl.classed("vzb-dialog-expand-true", true);
    }
    this.dialog_popup = dialog_popup;
    this.dialog_sidebar = dialog_sidebar;
  },

  readyOnce() {
    const _this = this;

    this.element = d3.select(this.placeholder);
    this.element.selectAll("div").remove();

    this._addDialogs(this.dialog_popup, this.dialog_sidebar);

    this.resize();

    if (this.dialog_popup.length !== 0) {
      this.root.findChildByName("gapminder-buttonlist")
        .on("click", (evt, button) => {
          if (!_this._available_dialogs[button.id]) return;

          if (button.active) {
            _this.openDialog(button.id);
          } else {
            _this.closeDialog(button.id);
          }
        });

      const popupDialogs = this.element.selectAll(".vzb-top-dialog").filter(d => _this.dialog_popup.indexOf(d.id) > -1);

      const close_buttons = popupDialogs.select(".vzb-top-dialog>.vzb-dialog-modal>.vzb-dialog-buttons>[data-click='closeDialog']");
      close_buttons.on("click", (d, i) => {
        _this.closeDialog(d.id);
      });

      const pinDialog = popupDialogs.select(".vzb-top-dialog>.vzb-dialog-modal>[data-click='pinDialog']");
      pinDialog.on("click", (d, i) => {
        _this.pinDialog(d.id);
      });

      this.rootEl.node().addEventListener("click", () => {
        _this.closeAllDialogs();
      });

      this.rootEl.on("mousedown", function(e) {
        if (!this._active_comp) return; //don't do anything if nothing is open

        let target = d3.event.target;
        let closeDialog = true;
        while (target) {
          if (target.classList.contains("vzb-dialog-modal")) {
            closeDialog = false;
            break;
          }
          target = target.parentElement;
        }
        if (closeDialog) {
          _this.closeAllDialogs();
        }
      });
    }

    this.element.on("click", () => {
      d3.event.stopPropagation();
    });

  },

  resize() {
    const _this = this;
    const profile = this.getLayoutProfile();

    this.element.selectAll(".vzb-top-dialog").each(function(d) {
      const dialogEl = d3.select(this);
      let cls = dialogEl.attr("class").replace(" vzb-popup", "").replace(" vzb-sidebar", "");

      if (profile === "large" && _this.dialog_sidebar.indexOf(d.id) > -1) {
        cls += " vzb-sidebar";
      } else if (_this.dialog_popup.indexOf(d.id) > -1) {
        cls += " vzb-popup";
      }

      dialogEl.attr("class", cls);
    });

  },

  /*
   * adds dialogs configuration to the components and template_data
   * @param {Array} dialog_list list of dialogs to be added
   */
  _addDialogs(dialog_popup, dialog_sidebar) {

    const profile = this.getLayoutProfile();
    let dialog_list = [];

    dialog_list = dialog_popup ? dialog_list.concat(dialog_popup) : dialog_list;
    dialog_list = dialog_sidebar ? dialog_list.concat(dialog_sidebar) : dialog_list;

    dialog_list = utils.unique(dialog_list);

    this._components_config = [];
    const details_dlgs = [];
    if (!dialog_list.length) return;
    //add a component for each dialog
    for (let i = 0; i < dialog_list.length; i++) {

      const dlg = dialog_list[i];
      const dlg_config = this._available_dialogs[dlg];

      //if it's a dialog, add component
      if (dlg_config && dlg_config.dialog) {
        const comps = this._components_config;

        //add corresponding component
        comps.push({
          component: dlg_config.dialog,
          placeholder: '.vzb-dialogs-dialog[data-dlg="' + dlg + '"]',
          model: ["state", "ui", "locale"]
        });

        dlg_config.component = comps.length - 1;
      }

      dlg_config.id = dlg;
      details_dlgs.push(dlg_config);
    }


    this.element.selectAll("div").data(details_dlgs)
      .enter().append("div")
      .attr("data-dlg", d => d.id)
      .attr("class", "vzb-top-dialog vzb-dialogs-dialog vzb-dialog-shadow");

    this.loadSubComponents();

    const _this = this;
    //render each subcomponent
    utils.forEach(this.components, subcomp => {
      subcomp.render();
      _this.on("resize", () => {
        subcomp.trigger("resize");
      });
      subcomp.on("dragstart", () => {
        _this.bringForward(subcomp.name);
      });
      subcomp.on("close", function() {
        this.placeholderEl.each(d => {
          const evt = {};
          evt.id = d.id;
          _this.trigger("close", evt);
        });
      });
    });

  },

  bringForward(id) {
    const dialog = this.element.select(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");
    dialog.style("z-index", this._curr_dialog_index);
    this._curr_dialog_index += 10;
  },

  //TODO: make opening/closing a dialog via update and model
  /*
   * Activate a dialog
   * @param {String} id dialog id
   */
  openDialog(id) {
    //close pinned dialogs for small profile
    const forceClose = this.getLayoutProfile() === "small";
    this.closeAllDialogs(forceClose);

    const dialog = this.element.selectAll(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");

    this._active_comp = this.components[this._available_dialogs[id].component];

    this._active_comp.beforeOpen();
    //add classes
    dialog.classed(class_active, true);

    this.bringForward(id);

    //call component function
    this._active_comp.open();
  },


  pinDialog(id) {
    const dialog = this.element.select(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");

    if (this._available_dialogs[id].ispin) {
      dialog.classed("pinned", false);
      this._available_dialogs[id].ispin = false;
    } else {
      dialog.classed("pinned", true);
      this._available_dialogs[id].ispin = true;
    }
  },


  /*
   * Closes a dialog
   * @param {String} id dialog id
   */
  closeDialog(id) {
    const dialog = this.element.selectAll(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");

    this._active_comp = this.components[this._available_dialogs[id].component];

    if (this._active_comp && !this._active_comp.isOpen) return;

    if (this._available_dialogs[id].ispin)
      this.pinDialog(id);

    if (this._active_comp) {
      this._active_comp.beforeClose();
    }
    //remove classes
    dialog.classed(class_active, false);

    //call component close function
    if (this._active_comp) {
      this._active_comp.close();
    }
    this._active_comp = false;

  },

  /*
   * Close all dialogs
   */
  closeAllDialogs(forceclose) {
    const _this = this;
    //remove classes
    const dialogClass = forceclose ? ".vzb-popup.vzb-dialogs-dialog.vzb-active" : ".vzb-popup.vzb-dialogs-dialog.vzb-active:not(.pinned)";
    const all_dialogs = this.element.selectAll(dialogClass);
    all_dialogs.each(d => {
      _this.closeDialog(d.id);
    });
  }

});

export default Dialogs;
