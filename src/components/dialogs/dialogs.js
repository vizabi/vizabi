import * as utils from 'base/utils';
import Component from 'base/component';
import * as iconset from 'base/iconset';

//dialogs
import * as dialogs from 'dialogs/_index';

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
      type: "model"
    }, {
      name: "language",
      type: "language"
    }];
    
    this._available_dialogs = {
      'find': {
        dialog: dialogs.find,
        ispin: false
      },
      'show': {
        dialog: dialogs.show,
        ispin: false
      },
      'moreoptions': {
        dialog: dialogs.moreoptions,
        ispin: false
      },
      'colors': {
        dialog: dialogs.colors,
        ispin: false
      },
      'size': {
        dialog: dialogs.size,
        ispin: false
      },
      'axes': {
        dialog: dialogs.axes,
        ispin: false
      },
      'axesmc': {
        dialog: dialogs.axesmc,
        ispin: false
      },
      'stack': {
        dialog: dialogs.stack,
        ispin: false
      },
      '_default': {
        dialog: false,
        ispin: false
      }
    };
    
    this._super(config, context);

  },
  
  readyOnce: function() {

    var _this = this;
    var dialog_expand = this.model.ui.buttons_expand;

    this.element = d3.select(this.placeholder);

    this.element.selectAll("div").remove();
  
    // if dialog_expand has been passed in with boolean param or array must check and covert to array
    if (dialog_expand){
      this.model.ui.buttons_expand = (dialog_expand === true) ? this.model.ui.buttons : dialog_expand;
    }

    if (dialog_expand.length !== 0) {
        d3.select(this.root.element).classed("vzb-dialog-expand-true", true);
    }
    
    var dialog_list = [].concat(dialog_expand);

    this.model.ui.buttons.forEach(function(dialog) {
      if (dialog_list.indexOf(dialog) === -1) {
        dialog_list.push(dialog);
      }
    });

    this.model.ui.buttons = dialog_list;

    //add buttons and render components
    if(this.model.ui.buttons) {
      this._addDialogs();
      this.root.findChildByName("gapminder-buttonlist")
        .on("click", function(evt, button) {
          if(!_this._available_dialogs[button.id]) return;

          if(button.active) {
            _this.openDialog(button.id)
          } else {
            _this.closeDialog(button.id)
          }
        });

    }
  
    var close_buttons = this.element.selectAll(".vzb-dialogs-dialog").select("[data-click='closeDialog']");
    close_buttons.on('click', function(type, index) {
      _this.closeDialog(_this.model.ui.buttons[index]);
    });
    var pinDialog = this.element.selectAll("[data-click='pinDialog']");
    pinDialog.on('click', function(d, i) {
      _this.pinDialog(d.id);
    });

    this.element.on('click', function() {
      d3.event.stopPropagation();
    });

    this.root.element.addEventListener('click', function() {
      _this.closeAllDialogs();
    });

    d3.select(this.root.element).on("mousedown", function(e) {
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
  
  },  /*
   * adds dialogs configuration to the components and template_data
   * @param {Array} dialog_list list of dialogs to be added
   */
  _addDialogs: function() {

    this._components_config = [];
    var dialog_list = this.model.ui.buttons;
    var details_dlgs = [],
        dialog_expand = this.model.ui.buttons_expand;
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
          placeholder: '.vzb-dialogs-dialog[data-btn="' + dlg + '"]',
          model: ["state", "ui", "language"]
        });

        dlg_config.component = comps.length - 1;
      }

      //add template data
      var d = (dlg_config) ? dlg : "_default";
      var details_dlg = this._available_dialogs[d];

      details_dlg.id = dlg;
      details_dlgs.push(details_dlg);
    };

    this.element.selectAll('div').data(details_dlgs)
      .enter().append("div")
      .attr('class', function (d) {
        var cls = 'vzb-dialogs-dialog';
        if (dialog_expand && dialog_expand.length > 0) {
          if (dialog_expand.indexOf(d.id) > -1) {
            cls += ' vzb-dialog-side';
          }
        }

        return cls;
      })
      .attr('data-btn', function(d) {
        return d.id;
      });

    this.loadComponents();

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
        _this.root.findChildByName("gapminder-buttonlist")
          .setButtonActive(this.name, false);
      })
    });
    
  },
  
  bringForward: function(id) {
    var dialog = this.element.select(".vzb-dialogs-dialog[data-btn='" + id + "']");
    dialog.style('z-index', this._curr_dialog_index);
    this._curr_dialog_index += 10;
  },

  //TODO: make opening/closing a dialog via update and model
  /*
   * Activate a dialog
   * @param {String} id dialog id
   */
  openDialog: function(id) {
    
    this.closeAllDialogs();

    var dialog = this.element.selectAll(".vzb-dialogs-dialog[data-btn='" + id + "']");

    this._active_comp = this.components[this._available_dialogs[id].component];

    this._active_comp.beforeOpen();
    //add classes
    dialog.classed(class_active, true);

    this.bringForward(id);

    // if (this.getLayoutProfile() === 'large' && this.model.ui.buttons_expand.indexOf(id) !== -1) {
    //   dialog.classed(class_expand_dialog, true);
    // }

    //call component function
    this._active_comp.open();
  },


  pinDialog: function(id) {
    var dialog = this.element.select(".vzb-dialogs-dialog[data-btn='" + id + "']");

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
    var dialog = this.element.selectAll(".vzb-dialogs-dialog[data-btn='" + id + "']");

    this._active_comp = this.components[this._available_dialogs[id].component];

    if(this._active_comp && !this._active_comp.isOpen) return;
    
    if(this._available_dialogs[id].ispin)
      this.pinDialog(id);

    if(this._active_comp) {
      this._active_comp.beforeClose();
    }
    //remove classes
    dialog.classed(class_active, false);

    // if (this.getLayoutProfile() === 'large' && this.model.ui.buttons_expand.indexOf(id) !== -1) {
    //   dialog.classed(class_expand_dialog, false);
    // }

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
    var dialogClass = forceclose ? ".vzb-dialogs-dialog.vzb-active" : ".vzb-dialogs-dialog.vzb-active:not(.pinned)";
    var all_dialogs = this.element.selectAll(dialogClass);
      all_dialogs.each(function(d) {
        _this.closeDialog(d.id)
      });
    
    this.model.state.entities.setNeedUpdate();
  }
  
});

export default Dialogs;
