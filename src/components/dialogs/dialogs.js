import requireAll from 'helpers/requireAll';
import * as utils from 'base/utils';
import Component from 'base/component';
import * as iconset from 'base/iconset';

//dialogs
const dialogs = requireAll(require.context('../../components/dialogs', true, /\.js$/), 1);

/*!
 * VIZABI DIALOGS
 * Reusable dialogs component
 */

//default existing dialogs
var class_active = "vzb-active";
var class_expand_dialog = "vzb-dialog-side";

var Dialogs = Component.extend({

  /**
   * Initializes the dialogs
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, context) {

    //set properties
    var _this = this;
    this.name = 'gapminder-dialogs';
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
      'find': {
        dialog: dialogs.find,
      },
      'show': {
        dialog: dialogs.show,
      },
      'moreoptions': {
        dialog: dialogs.moreoptions,
      },
      'colors': {
        dialog: dialogs.colors,
      },
      'size': {
        dialog: dialogs.size,
      },
      'label': {
        dialog: dialogs.label,
      },
      'zoom': {
        dialog: dialogs.zoom,
      },
      'axes': {
        dialog: dialogs.axes,
      },
      'axesmc': {
        dialog: dialogs.axesmc,
      },
      'stack': {
        dialog: dialogs.stack,
      },
      'speed': {
        dialog: dialogs.speed
      },
      'opacity': {
        dialog: dialogs.opacity
      },
      'presentation': {
        dialog: dialogs.presentation
      },
      'about': {
        dialog: dialogs.about
      }
    };

    this._super(config, context);

  },

  domReady: function() {
    var dialog_popup = (this.model.ui.dialogs||{}).popup || [];
    var dialog_sidebar = (this.model.ui.dialogs||{}).sidebar || [];

    this.rootEl = this.root.element instanceof Array? this.root.element : d3.select(this.root.element);

    // if dialog_sidebar has been passed in with boolean param or array must check and covert to array
    if (dialog_sidebar === true) {
      dialog_sidebar = dialog_popup;
      (this.model.ui.dialogs||{}).sidebar = dialog_sidebar;
    }
    if (dialog_sidebar.length !== 0) {
      this.rootEl.classed("vzb-dialog-expand-true", true);
    }
    this.dialog_popup = dialog_popup;
    this.dialog_sidebar = dialog_sidebar;
  },

  readyOnce: function() {
    var _this = this;

    this.element = d3.select(this.placeholder);
    this.element.selectAll("div").remove();

    this._addDialogs(this.dialog_popup, this.dialog_sidebar);

    this.resize();

    if(this.dialog_popup.length !== 0) {
      this.root.findChildByName("gapminder-buttonlist")
        .on("click", function(evt, button) {
          if(!_this._available_dialogs[button.id]) return;

          if(button.active) {
            _this.openDialog(button.id)
          } else {
            _this.closeDialog(button.id)
          }
        });

      var popupDialogs = this.element.selectAll(".vzb-top-dialog").filter(function(d) {return _this.dialog_popup.indexOf(d.id) > -1});

      var close_buttons = popupDialogs.select(".vzb-top-dialog>.vzb-dialog-modal>.vzb-dialog-buttons>[data-click='closeDialog']");
      close_buttons.on('click', function(d, i) {
        _this.closeDialog(d.id);
      });

      var pinDialog = popupDialogs.select(".vzb-top-dialog>.vzb-dialog-modal>[data-click='pinDialog']");
      pinDialog.on('click', function(d, i) {
        _this.pinDialog(d.id);
      });

      this.rootEl.node().addEventListener('click', function() {
        _this.closeAllDialogs();
      });

      this.rootEl.on("mousedown", function(e) {
        if(!this._active_comp) return; //don't do anything if nothing is open

        var target = d3.event.target;
        var closeDialog = true;
        while(target) {
          if(target.classList.contains("vzb-dialog-modal")) {
            closeDialog = false;
            break;
          }
          target = target.parentElement;
        }
        if(closeDialog) {
          _this.closeAllDialogs();
        }
      });
    }

    this.element.on('click', function() {
      d3.event.stopPropagation();
    });

  },

  resize: function() {
    var _this = this;
    var profile = this.getLayoutProfile();

    this.element.selectAll(".vzb-top-dialog").each(function(d) {
      var dialogEl = d3.select(this);
      var cls = dialogEl.attr('class').replace(' vzb-popup','').replace(' vzb-sidebar','');

      if (profile === 'large' && _this.dialog_sidebar.indexOf(d.id) > -1) {
        cls += ' vzb-sidebar';
      } else if(_this.dialog_popup.indexOf(d.id) > -1) {
        cls += ' vzb-popup';
      }

      dialogEl.attr('class', cls);
    });

  },

  /*
   * adds dialogs configuration to the components and template_data
   * @param {Array} dialog_list list of dialogs to be added
   */
  _addDialogs: function(dialog_popup, dialog_sidebar) {

    var profile = this.getLayoutProfile();
    var dialog_list = [];

    dialog_list = dialog_popup ? dialog_list.concat(dialog_popup) : dialog_list;
    dialog_list = dialog_sidebar ? dialog_list.concat(dialog_sidebar) : dialog_list;

    dialog_list = utils.unique(dialog_list);

    this._components_config = [];
    var details_dlgs = [];
    if(!dialog_list.length) return;
    //add a component for each dialog
    for(var i = 0; i < dialog_list.length; i++) {

      var dlg = dialog_list[i];
      var dlg_config = this._available_dialogs[dlg];

      //if it's a dialog, add component
      if(dlg_config && dlg_config.dialog) {
        var comps = this._components_config;

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
    };

    this.element.selectAll('div').data(details_dlgs)
      .enter().append("div")
      .attr('data-dlg', function(d) {
        return d.id;
      })
      .attr('class', 'vzb-top-dialog vzb-dialogs-dialog vzb-dialog-shadow');

    this.loadSubComponents();

    var _this = this;
    //render each subcomponent
    utils.forEach(this.components, function(subcomp) {
      subcomp.render();
      _this.on('resize', function() {
        subcomp.trigger('resize');
      });
      subcomp.on('dragstart', function() {
        _this.bringForward(subcomp.name);
      });
      subcomp.on('close', function() {
        this.placeholderEl.each( function(d) {
          var evt = {};
          evt.id = d.id;
          _this.trigger('close', evt);
        });
      });
    });

  },

  bringForward: function(id) {
    var dialog = this.element.select(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");
    dialog.style('z-index', this._curr_dialog_index);
    this._curr_dialog_index += 10;
  },

  //TODO: make opening/closing a dialog via update and model
  /*
   * Activate a dialog
   * @param {String} id dialog id
   */
  openDialog: function(id) {
    //close pinned dialogs for small profile
    var forceClose = this.getLayoutProfile() === 'small' ? true : false;
    this.closeAllDialogs(forceClose);

    var dialog = this.element.selectAll(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");

    this._active_comp = this.components[this._available_dialogs[id].component];

    this._active_comp.beforeOpen();
    //add classes
    dialog.classed(class_active, true);

    this.bringForward(id);

    //call component function
    this._active_comp.open();
  },


  pinDialog: function(id) {
    var dialog = this.element.select(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");

    if(this._available_dialogs[id].ispin) {
      dialog.classed('pinned', false);
      this._available_dialogs[id].ispin = false;
    } else {
      dialog.classed('pinned', true);
      this._available_dialogs[id].ispin = true;
    }
  },


  /*
   * Closes a dialog
   * @param {String} id dialog id
   */
  closeDialog: function(id) {
    var dialog = this.element.selectAll(".vzb-popup.vzb-dialogs-dialog[data-dlg='" + id + "']");

    this._active_comp = this.components[this._available_dialogs[id].component];

    if(this._active_comp && !this._active_comp.isOpen) return;

    if(this._available_dialogs[id].ispin)
      this.pinDialog(id);

    if(this._active_comp) {
      this._active_comp.beforeClose();
    }
    //remove classes
    dialog.classed(class_active, false);

    //call component close function
    if(this._active_comp) {
      this._active_comp.close();
    }
    this._active_comp = false;

  },

  /*
   * Close all dialogs
   */
  closeAllDialogs: function(forceclose) {
    var _this = this;
    //remove classes
    var dialogClass = forceclose ? ".vzb-popup.vzb-dialogs-dialog.vzb-active" : ".vzb-popup.vzb-dialogs-dialog.vzb-active:not(.pinned)";
    var all_dialogs = this.element.selectAll(dialogClass);
      all_dialogs.each(function(d) {
        _this.closeDialog(d.id)
      });
  }

});

export default Dialogs;
