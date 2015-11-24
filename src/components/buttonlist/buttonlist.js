import * as utils from 'base/utils';
import Component from 'base/component';
import * as iconset from 'base/iconset';

//dialogs
import * as dialogs from 'dialogs/_index';

/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

//default existing buttons
var class_active = "vzb-active";
var class_active_locked = "vzb-active-locked";
var class_expand_dialog = "vzb-dialog-side";
var class_hide_btn = "vzb-dialog-side-btn";
var class_unavailable = "vzb-unavailable";
var class_vzb_fullscreen = "vzb-force-fullscreen";
var class_container_fullscreen = "vzb-container-fullscreen";

//default values
var button_size = 80;

var ButtonList = Component.extend({

  /**
   * Initializes the buttonlist
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, context) {

    //set properties
    var _this = this;
    this.name = 'gapminder-buttonlist';
    this.template = '<div class="vzb-buttonlist"></div>';
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

    this._available_buttons = {
      'find': {
        title: "buttons/find",
        icon: "search",
        dialog: dialogs.find,
        ispin: false,
        required: false,
        isgraph: false
      },
      'show': {
        title: "buttons/show",
        icon: "asterisk",
        dialog: dialogs.show,
        ispin: false,
        required: false,
        isgraph: false
      },
      'moreoptions': {
        title: "buttons/more_options",
        icon: "gear",
        dialog: dialogs.moreoptions,
        ispin: false,
        required: true,
        isgraph: false
      },
      'colors': {
        title: "buttons/colors",
        icon: "paintbrush",
        dialog: dialogs.colors,
        ispin: false,
        required: false,
        isgraph: false
      },
      'size': {
        title: "buttons/size",
        icon: "circle",
        dialog: dialogs.size,
        ispin: false,
        required: false,
        isgraph: false
      },
      'fullscreen': {
        title: "buttons/expand",
        icon: "expand",
        dialog: false,
        func: this.toggleFullScreen.bind(this),
        required: true,
        isgraph: false
      },
      'trails': {
        title: "buttons/trails",
        icon: "trails",
        dialog: false,
        func: this.toggleBubbleTrails.bind(this),
        required: false,
        isgraph: true
      },
      'lock': {
        title: "buttons/lock",
        icon: "lock",
        dialog: false,
        func: this.toggleBubbleLock.bind(this),
        required: false,
        isgraph: true
      },
      'presentation': {
        title: "buttons/presentation",
        icon: "presentation",
        dialog: false,
        func: this.togglePresentationMode.bind(this),
        required: false,
        isgraph: false
      },
      'axes': {
        title: "buttons/axes",
        icon: "axes",
        dialog: dialogs.axes,
        ispin: false,
        required: false,
        isgraph: false
      },
      'axesmc': {
        title: "buttons/axesmc",
        icon: "axes",
        dialog: dialogs.axesmc,
        ispin: false,
        required: false,
        isgraph: false
      },
      'stack': {
        title: "buttons/stack",
        icon: "stack",
        dialog: dialogs.stack,
        ispin: false,
        required: false,
        isgraph: false
      },
      '_default': {
        title: "Button",
        icon: "asterisk",
        dialog: false,
        required: false,
        isgraph: false
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
        _this._toggleButtons();


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
    var button_expand = this.model.ui.buttons_expand;

    this.element = d3.select(this.element);
    this.dialogContainerEl = this.element.append("div")
      .attr("class", "vzb-buttonlist-container-dialogs");
    this.buttonContainerEl = this.element.append("div")
      .attr("class", "vzb-buttonlist-container-buttons");

    // if button_expand has been passed in with boolean param or array must check and covert to array
    if (button_expand){
      this.model.ui.buttons_expand = (button_expand === true) ? this.model.ui.buttons : button_expand;
    }

    if (button_expand.length !== 0) {
        d3.select(this.root.element).classed("vzb-button-expand-true", true);
    }
    var button_list = [].concat(button_expand);

    this.model.ui.buttons.forEach(function(button) {
      if (button_list.indexOf(button) === -1) {
        button_list.push(button);
      }
    });

    this.model.ui.buttons = button_list;

    //add buttons and render components
    if(this.model.ui.buttons) {
      this._addButtons();
    }

    var buttons = this.element.selectAll(".vzb-buttonlist-btn");

    this._toggleButtons();
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

    var close_buttons = this.element.selectAll(".vzb-buttonlist-dialog").select("[data-click='closeDialog']");
    close_buttons.on('click', function(type, index) {
      _this.closeDialog(_this.model.ui.buttons[index]);
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
    this.setPresentationMode();

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
   * reset buttons show state
   */
   _showAllButtons: function() {
     // show all existing buttons
     var _this = this;
     var buttons = this.element.selectAll(".vzb-buttonlist-btn");
     buttons.each(function(d,i) {
       var button = d3.select(this);
       if (button.style("display") == "none"){
         if(!d.isgraph){
           button.style("display", "inline-block");
         } else if ((_this.model.state.entities.select.length > 0)){
           button.style("display", "inline-block");
         }
       }
     });
   },

  /*
   * determine which buttons are shown on the buttonlist
   */
   _toggleButtons: function() {
     var _this = this;
     var button_expand = this.model.ui.buttons_expand;
     _this._showAllButtons();

     var buttons = this.element.selectAll(".vzb-buttonlist-btn");
     var button_width = 80;
     var container = this.element.node().getBoundingClientRect();
     var container_width = this.element.node().getBoundingClientRect().width;
     var not_required = [];
     var required = [];
     var buttons_width = 0;
     //only if the container can contain more than one button
     if(container_width > button_size){
       buttons.each(function(d,i) {
         var button_data = d;
         var button = d3.select(this);
         var expandable = button_expand.indexOf(button_data.id) !== -1;
         var button_margin = {right: parseInt(button.style("margin-right")), left: parseInt(button.style("margin-left"))}
         button_width = button.node().getBoundingClientRect().width + button_margin.right + button_margin.left;

         if(!button_data.isgraph){
           if(!expandable || (_this.getLayoutProfile() !== 'large')){
             buttons_width += button_width;
             //sort buttons between required and not required buttons.
             // Not required buttons will only be shown if there is space available
             if(button_data.required){
               required.push(button);
             } else {
               not_required.push(button);
             }
           } else {
              button.style("display", "none");
           }
         } else if (_this.model.state.entities.select.length > 0){
           buttons_width += button_width;
           //sort buttons between required and not required buttons.
           // Not required buttons will only be shown if there is space available
           if(button_data.required){
             required.push(button);
           } else {
             not_required.push(button);
           }
         }
       });
       var width_diff = buttons_width - container_width;

       //check if the width_diff is small. If it is, add to the container
       // width, to allow more buttons in a way that is still usable
       if(width_diff > 0 && width_diff <=10){
         container_width += width_diff;
       }
       var number_of_buttons = Math.floor(container_width / button_width) - required.length;
       if(number_of_buttons < 0){
         number_of_buttons = 0;
       }
       //change the display property of non required buttons, from right to
       // left
       not_required.reverse();
       for (var i = 0 ; i < not_required.length-number_of_buttons ; i++) {
           not_required[i].style("display", "none");
       }
     }
   },

  /*
   * adds buttons configuration to the components and template_data
   * @param {Array} button_list list of buttons to be added
   */
  _addButtons: function() {

    this._components_config = [];
    var button_list = this.model.ui.buttons;
    var details_btns = [],
        button_expand = this.model.ui.buttons_expand;
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
      .attr('class', function (d) {
        var cls = 'vzb-buttonlist-btn';
        if (button_expand && button_expand.length > 0) {
          if (button_expand.indexOf(d.id) > -1) {
            cls += ' vzb-dialog-side-btn';
          }
        }

        return cls;
      })
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
      .attr('class', function (d) {
        var cls = 'vzb-buttonlist-dialog';
        if (button_expand && button_expand.length > 0) {
          if (button_expand.indexOf(d.id) > -1) {
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
    this._toggleButtons();
  },

  //TODO: make opening/closing a dialog via update and model
  /*
   * Activate a button dialog
   * @param {String} id button id
   */
  openDialog: function(id) {

    this.closeAllDialogs();

    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
      dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

    this._active_comp = this.components[this._available_buttons[id].component];

    this._active_comp.beforeOpen();
    //add classes
    btn.classed(class_active, true);
    dialog.classed(class_active, true);

    this.bringForward(id);

    if (this.getLayoutProfile() === 'large' && this.model.ui.buttons_expand.indexOf(id) !== -1) {
      btn.classed(class_hide_btn, true);
      dialog.classed(class_expand_dialog, true);
    }

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

    this._active_comp = this.components[this._available_buttons[id].component];

    if(this._available_buttons[id].ispin)
      this.pinDialog(id);

    if(this._active_comp) {
      this._active_comp.beforeClose();
    }
    //remove classes
    btn.classed(class_active, false);
    dialog.classed(class_active, false);

    if (this.getLayoutProfile() === 'large' && this.model.ui.buttons_expand.indexOf(id) !== -1) {
      btn.classed(class_hide_btn, false);
      dialog.classed(class_expand_dialog, false);
    }

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
    var btnClass = forceclose ? ".vzb-buttonlist-btn" : ".vzb-buttonlist-btn:not(.pinned)";
    var dialogClass = forceclose ? ".vzb-buttonlist-dialog" : ".vzb-buttonlist-dialog:not(.pinned)";
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

  bringForward: function(id) {
    var dialog = this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']");
    dialog.style('z-index', this._curr_dialog_index);
    this._curr_dialog_index += 10;
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
  togglePresentationMode: function() {
    this.model.ui.presentation = !this.model.ui.presentation;
    this.setPresentationMode();
  },
  setPresentationMode: function() {
    var id = 'presentation';
    var translator = this.model.language.getTFunction();
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");

    btn.classed(class_active_locked, this.model.ui.presentation);
  },
  toggleFullScreen: function(id) {

    if(!window) return;

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
    if (typeof container != 'undefined') {
      utils.classed(container, class_container_fullscreen, fs);
    }

    this.model.ui.fullscreen = fs;
    var translator = this.model.language.getTFunction();
    btn.classed(class_active_locked, fs);

    btn.select(".vzb-buttonlist-btn-icon").html(iconset[fs ? "unexpand" : "expand"]);

    btn.select(".vzb-buttonlist-btn-title>span").text(
      translator("buttons/" + (fs ? "unexpand" : "expand"))
    )
    .attr("data-vzb-translate", "buttons/" + (fs ? "unexpand" : "expand"));

    //restore body overflow
    document.body.style.overflow = body_overflow;

    //force window resize event
    (function() {
      event = window.document.createEvent("HTMLEvents");
      event.initEvent("resize", true, true);
      event.eventName = "resize";
      window.dispatchEvent(event);
    })();
  }

});

function isFullscreen() {
  if(!window) return false;
  if(window.document.webkitIsFullScreen !== undefined)
    return window.document.webkitIsFullScreen;
  if(window.document.mozFullScreen !== undefined)
    return window.document.mozFullScreen;
  if(window.document.msFullscreenElement !== undefined)
    return window.document.msFullscreenElement;

  return false;
}

function exitHandler(emulateClickFunc) {
  if(!isFullscreen()) {
    emulateClickFunc();
  }
}

function subscribeFullscreenChangeEvent(exitFunc) {
  if(!window) return;
  var doc = window.document;

  this.exitFullscreenHandler = exitHandler.bind(this, exitFunc);
  doc.addEventListener('webkitfullscreenchange', this.exitFullscreenHandler, false);
  doc.addEventListener('mozfullscreenchange', this.exitFullscreenHandler, false);
  doc.addEventListener('fullscreenchange', this.exitFullscreenHandler, false);
  doc.addEventListener('MSFullscreenChange', this.exitFullscreenHandler, false);
}

function removeFullscreenChangeEvent() {
  var doc = window.document;

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
    if (!(navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent && !navigator.userAgent.match('CriOS'))) {
      elem.webkitRequestFullscreen();
    }

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
