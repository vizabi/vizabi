import utils from '../../base/utils';
import Component from '../../base/component';
import iconset from '../../base/iconset';

//dialogs
import * as dialogs from './dialogs/_index';

/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

//default existing buttons
var class_active = "vzb-active";
var class_active_locked = "vzb-active-locked";
var class_unavailable = "vzb-unavailable";
var class_vzb_fullscreen = "vzb-force-fullscreen";

var ButtonList = Component.extend('gapminder-buttonlist', {

  /**
   * Initializes the buttonlist
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, context) {

    //set properties
    var _this = this;
    this.name = 'buttonlist';
    this.template = '<div class="vzb-buttonlist"></div>';

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

    this._available_buttons = {
      'find': {
        title: "buttons/find",
        icon: "search",
        dialog: dialogs.find,
        ispin: false,
      },
      'moreoptions': {
        title: "buttons/more_options",
        icon: "gear",
        dialog: dialogs.moreoptions,
        ispin: false
      },
      'colors': {
        title: "buttons/colors",
        icon: "paint-brush",
        dialog: dialogs.colors,
        ispin: false
      },
      'size': {
        title: "buttons/size",
        icon: "circle",
        dialog: dialogs.size,
        ispin: false
      },
      'fullscreen': {
        title: "buttons/expand",
        icon: "expand",
        dialog: false,
        func: this.toggleFullScreen.bind(this)
      },
      'trails': {
        title: "buttons/trails",
        icon: "trails",
        dialog: false,
        func: this.toggleBubbleTrails.bind(this)
      },
      'lock': {
        title: "buttons/lock",
        icon: "lock",
        dialog: false,
        func: this.toggleBubbleLock.bind(this)
      },
      'axes': {
        title: "buttons/axes",
        icon: "axes",
        dialog: dialogs.axes,
        ispin: false
      },
      'axesmc': {
        title: "buttons/axes_mc",
        icon: "axes",
        dialog: dialogs.axesmc,
        ispin: false
      },
      'stack': {
        title: "buttons/stack",
        icon: "stack",
        dialog: dialogs.stack,
        ispin: false
      },
      '_default': {
        title: "Button",
        icon: "asterisk",
        dialog: false
      }
    };

    this._active_comp = false;

    this.model_binds = {
      "change:state:entities:select": function() {
        if(!_this._readyOnce) return;

        if(_this.model.state.entities.select.length === 0) {
          _this.model.state.time.lockNonSelected = 0;
        }
        _this.setBubbleTrails();
        _this.setBubbleLock();


        //scroll button list to end if bottons appeared or disappeared
        if(_this.entitiesSelected_1 !== (_this.model.state.entities.select.length > 0)) {
          _this.scrollToEnd();
        }
        _this.entitiesSelected_1 = _this.model.state.entities.select.length > 0;
      }
    }

    this._super(config, context);

  },

  readyOnce: function() {

    var _this = this;

    this.element = d3.select(this.element);
    this.buttonContainerEl = this.element.append("div")
      .attr("class", "vzb-buttonlist-container-buttons");
    this.dialogContainerEl = this.element.append("div")
      .attr("class", "vzb-buttonlist-container-dialogs");

    //add buttons and render components
    if(this.model.ui.buttons) {
      this._addButtons();
    }

    var buttons = this.element.selectAll(".vzb-buttonlist-btn");

    //activate each dialog when clicking the button
    buttons.on('click', function() {

      d3.event.preventDefault();
      d3.event.stopPropagation();
      var btn = d3.select(this),
        id = btn.attr("data-btn"),
        classes = btn.attr("class"),
        btn_config = _this._available_buttons[id];

      //if it's a dialog, open
      if(btn_config && btn_config.dialog) {

        //close if it's open
        if(classes.indexOf(class_active) !== -1) {
          _this.closeDialog(id);
        } else {
          _this.openDialog(id);
        }
      }
      //otherwise, execute function
      else if(btn_config.func) {
        btn_config.func(id);
      }

    });

    var close_buttons = this.element.selectAll("[data-click='closeDialog']");
    close_buttons.on('click', function() {
      _this.closeAllDialogs(true);
    });
    var pinDialog = this.element.selectAll("[data-click='pinDialog']");
    pinDialog.on('click', function() {
      _this.pinDialog(this);
    });

    d3.selectAll(".vzb-buttonlist-container-dialogs").on('click', function() {
      d3.event.stopPropagation();
    });

    this.root.element.addEventListener('click', function() {
      _this.closeAllDialogs();
    });

    //store body overflow
    this._prev_body_overflow = document.body.style.overflow;

    this.setBubbleTrails();
    this.setBubbleLock();

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
  },


  /*
   * adds buttons configuration to the components and template_data
   * @param {Array} button_list list of buttons to be added
   */
  _addButtons: function() {

    this._components_config = [];
    var button_list = this.model.ui.buttons;
    var details_btns = [];
    if(!button_list.length) return;
    //add a component for each button
    for(var i = 0; i < button_list.length; i++) {

      var btn = button_list[i];
      var btn_config = this._available_buttons[btn];

      //if it's a dialog, add component
      if(btn_config && btn_config.dialog) {
        var comps = this._components_config;

        //add corresponding component
        comps.push({
          component: btn_config.dialog,
          placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]',
          model: ["state", "ui", "language"]
        });

        btn_config.component = comps.length - 1;
      }

      //add template data
      var d = (btn_config) ? btn : "_default";
      var details_btn = this._available_buttons[d];

      details_btn.id = btn;
      details_btn.icon = iconset[details_btn.icon];
      details_btns.push(details_btn);
    };

    var t = this.getTranslationFunction(true);

    this.buttonContainerEl.selectAll('button').data(details_btns)
      .enter().append("button")
      .attr('class', 'vzb-buttonlist-btn')
      .attr('data-btn', function(d) {
        return d.id;
      })
      .html(function(btn) {
        return "<span class='vzb-buttonlist-btn-icon fa'>" +
          btn.icon + "</span><span class='vzb-buttonlist-btn-title'>" +
          t(btn.title) + "</span>";
      });

    this.dialogContainerEl.selectAll('div').data(details_btns)
      .enter().append("div")
      .attr('class', 'vzb-buttonlist-dialog')
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
    });
  },


  scrollToEnd: function() {
    var target = 0;
    var parent = d3.select(".vzb-tool");

    if(parent.classed("vzb-portrait") && parent.classed("vzb-small")) {
      if(this.model.state.entities.select.length > 0) target = this.buttonContainerEl[0][0].scrollWidth
      this.buttonContainerEl[0][0].scrollLeft = target;
    } else {
      if(this.model.state.entities.select.length > 0) target = this.buttonContainerEl[0][0].scrollHeight
      this.buttonContainerEl[0][0].scrollTop = target;
    }
  },


  /*
   * RESIZE:
   * Executed whenever the container is resized
   * Ideally, it contains only operations related to size
   */
  resize: function() {
    //TODO: what to do when resizing?
  },

  //TODO: make opening/closing a dialog via update and model
  /*
   * Activate a button dialog
   * @param {String} id button id
   */
  openDialog: function(id) {

    this.closeAllDialogs(true);

    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
      dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

    this._active_comp = this.components[this._available_buttons[id].component];

    this._active_comp.beforeOpen();
    //add classes
    btn.classed(class_active, true);
    dialog.classed(class_active, true);

    //call component function
    this._active_comp.open();
  },


  pinDialog: function(button) {
    var id = typeof button === 'string' ? button : button.getAttribute('data-dialogtype');
    var btn = this.element.select(".vzb-buttonlist-btn[data-btn='" + id + "']");
    var dialog = this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']");
    if(this._available_buttons[id].ispin) {
      // button.textContent = '';
      btn.classed('pinned', false);
      this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']").classed('pinned', false);
      this._available_buttons[id].ispin = false;
      this._active_comp.isPin = false;
    } else {
      //  button.textContent = '';
      btn.classed('pinned', true);
      dialog.classed('pinned', true);
      this._available_buttons[id].ispin = true;
      this._active_comp.isPin = true;
    }
  },


  /*
   * Closes a button dialog
   * @param {String} id button id
   */
  closeDialog: function(id) {

    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
      dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

    if(this._available_buttons[id].ispin)
      this.pinDialog(id);

    if(this._active_comp) {
      this._active_comp.beforeClose();
    }
    //remove classes
    btn.classed(class_active, false);
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
    //remove classes
    var btnClass = forceclose ? ".vzb-buttonlist-btn" : ".vzb-buttonlist-btn:not(.pinned)"
    var dialogClass = forceclose ? ".vzb-buttonlist-dialog" : ".vzb-buttonlist-dialog:not(.pinned)"
    var all_btns = this.element.selectAll(btnClass),
      all_dialogs = this.element.selectAll(dialogClass);
    if(forceclose)
      this.unpinAllDialogs();

    if(this._active_comp && (forceclose || !this._available_buttons[this._active_comp.name].ispin)) {
      this._active_comp.beforeClose();
    }

    all_btns.classed(class_active, false);
    all_dialogs.classed(class_active, false);

    //call component close function
    if(this._active_comp && (forceclose || !this._available_buttons[this._active_comp.name].ispin)) {
      this._active_comp.close();
    }
    if(this._active_comp && !this._available_buttons[this._active_comp.name].ispin)
      this._active_comp = false;

    this.model.state.entities.setNeedUpdate();
  },

  unpinAllDialogs: function() {
    var availBtns = this._available_buttons;
    var keys = Object.keys(availBtns);
    keys.forEach(function(dialogName) {
      if(availBtns[dialogName].ispin)
        this.pinDialog(dialogName);
    }.bind(this));
  },

  toggleBubbleTrails: function() {
    this.model.state.time.trails = !this.model.state.time.trails;
    this.setBubbleTrails();
  },
  setBubbleTrails: function() {
    var id = "trails";
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");

    btn.classed(class_active_locked, this.model.state.time.trails);
    btn.style("display", this.model.state.entities.select.length == 0 ? "none" : "inline-block")
  },
  toggleBubbleLock: function(id) {
    if(this.model.state.entities.select.length == 0) return;

    var timeFormatter = d3.time.format(this.model.state.time.formatInput);
    var locked = this.model.state.time.lockNonSelected;
    locked = locked ? 0 : timeFormatter(this.model.state.time.value);
    this.model.state.time.lockNonSelected = locked;

    this.setBubbleLock();
  },
  setBubbleLock: function() {
    var id = "lock";
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
    var translator = this.model.language.getTFunction();

    var locked = this.model.state.time.lockNonSelected;

    btn.classed(class_unavailable, this.model.state.entities.select.length == 0);
    btn.style("display", this.model.state.entities.select.length == 0 ? "none" : "inline-block")

    btn.classed(class_active_locked, locked)
    btn.select(".vzb-buttonlist-btn-title")
      .text(locked ? locked : translator("buttons/lock"));

    btn.select(".vzb-buttonlist-btn-icon")
      .html(iconset[locked ? "lock" : "unlock"]);
  },
  toggleFullScreen: function(id) {

    var component = this;
    var pholder = component.placeholder;
    var pholder_found = false;
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
    var fs = !this.model.ui.fullscreen;
    var body_overflow = (fs) ? "hidden" : this._prev_body_overflow;

    while(!(pholder_found = utils.hasClass(pholder, 'vzb-placeholder'))) {
      component = this.parent;
      pholder = component.placeholder;
    }

    //TODO: figure out a way to avoid fullscreen resize delay in firefox
    if(fs) {
      launchIntoFullscreen(pholder);
      subscribeFullscreenChangeEvent.call(this, this.toggleFullScreen.bind(this, id));
    } else {
      exitFullscreen.call(this);
    }

    utils.classed(pholder, class_vzb_fullscreen, fs);
    this.model.ui.fullscreen = fs;
    var translator = this.model.language.getTFunction();
    btn.classed(class_active_locked, fs);

    btn.select(".vzb-buttonlist-btn-icon").html(iconset[fs ? "unexpand" : "expand"]);
    btn.select(".vzb-buttonlist-btn-title").text(
      translator("buttons/" + (fs ? "unexpand" : "expand"))
    );

    //restore body overflow
    document.body.style.overflow = body_overflow;

    //force window resize event
    (function() {
      event = root.document.createEvent("HTMLEvents");
      event.initEvent("resize", true, true);
      event.eventName = "resize";
      root.dispatchEvent(event);
    })();

  }

});

function isFullscreen() {
  if(root.document.webkitIsFullScreen !== undefined)
    return root.document.webkitIsFullScreen;
  if(root.document.mozFullScreen !== undefined)
    return root.document.mozFullScreen;
  if(root.document.msFullscreenElement !== undefined)
    return root.document.msFullscreenElement;

  return false;
}

function exitHandler(emulateClickFunc) {
  if(!isFullscreen()) {
    emulateClickFunc();
  }
}

function subscribeFullscreenChangeEvent(exitFunc) {
  var doc = root.document;

  this.exitFullscreenHandler = exitHandler.bind(this, exitFunc);
  doc.addEventListener('webkitfullscreenchange', this.exitFullscreenHandler, false);
  doc.addEventListener('mozfullscreenchange', this.exitFullscreenHandler, false);
  doc.addEventListener('fullscreenchange', this.exitFullscreenHandler, false);
  doc.addEventListener('MSFullscreenChange', this.exitFullscreenHandler, false);
}

function removeFullscreenChangeEvent() {
  var doc = root.document;

  doc.removeEventListener('webkitfullscreenchange', this.exitFullscreenHandler);
  doc.removeEventListener('mozfullscreenchange', this.exitFullscreenHandler);
  doc.removeEventListener('fullscreenchange', this.exitFullscreenHandler);
  doc.removeEventListener('MSFullscreenChange', this.exitFullscreenHandler);
}

function launchIntoFullscreen(elem) {
  if(elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if(elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  } else if(elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if(elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
}

function exitFullscreen() {
  removeFullscreenChangeEvent.call(this);

  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

export default ButtonList;