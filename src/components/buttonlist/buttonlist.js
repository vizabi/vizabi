import * as utils from 'base/utils';
import Component from 'base/component';
import * as iconset from 'base/iconset';

/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

//default existing buttons
var class_active = "vzb-active";
var class_hidden = "vzb-hidden";
var class_active_locked = "vzb-active-locked";
var class_expand_dialog = "vzb-dialog-side";
var class_hide_btn = "vzb-dialog-side-btn";
var class_unavailable = "vzb-unavailable";
var class_vzb_fullscreen = "vzb-force-fullscreen";
var class_container_fullscreen = "vzb-container-fullscreen";

var ButtonList = Component.extend({

  /**
   * Initializes the buttonlist
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, context) {

    //set properties
    var _this = this;
    this.name = this.name || 'gapminder-buttonlist';
//    this.template = '<div class="vzb-buttonlist"></div>';

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

    this._available_buttons = {
      'find': {
        title: "buttons/find",
        icon: "search",
        required: false
      },
      'show': {
        title: "buttons/show",
        icon: "asterisk",
        required: false
      },
      'moreoptions': {
        title: "buttons/more_options",
        icon: "gear",
        required: true
      },
      'colors': {
        title: "buttons/colors",
        icon: "paintbrush",
        required: false
      },
      'size': {
        title: "buttons/size",
        icon: "circle",
        required: false
      },
      'fullscreen': {
        title: "buttons/expand",
        icon: "expand",
        func: this.toggleFullScreen.bind(this),
        required: true
      },
      'trails': {
        title: "buttons/trails",
        icon: "trails",
        func: this.toggleBubbleTrails.bind(this),
        required: false,
        statebind: "ui.chart.trails",
        statebindfunc: this.setBubbleTrails.bind(this)
      },
      'lock': {
        title: "buttons/lock",
        icon: "lock",
        func: this.toggleBubbleLock.bind(this),
        required: false,
        statebind: "ui.chart.lockNonSelected",
        statebindfunc: this.setBubbleLock.bind(this)
      },
      'inpercent': {
        title: "buttons/inpercent",
        icon: "percent",
        func: this.toggleInpercent.bind(this),
        required: false,
        statebind: "ui.chart.inpercent",
        statebindfunc: this.setInpercent.bind(this)
      },
      'presentation': {
        title: "buttons/presentation",
        icon: "presentation",
        func: this.togglePresentationMode.bind(this),
        required: false,
        statebind: "ui.presentation",
        statebindfunc: this.setPresentationMode.bind(this)
      },
      'about': {
        title: "buttons/about",
        icon: "about",
        required: false
      },
      'axes': {
        title: "buttons/axes",
        icon: "axes",
        required: false
      },
      'axesmc': {
        title: "buttons/axesmc",
        icon: "axes",
        required: false
      },
      'stack': {
        title: "buttons/stack",
        icon: "stack",
        required: false
      },
      '_default': {
        title: "Button",
        icon: "asterisk",
        required: false
      }
    };

    this._active_comp = false;

    this.model_binds = {
      "change:state.marker.select": function(evt) {
        if(!_this._readyOnce) return;

        _this.setBubbleTrails();
        _this.setBubbleLock();
        _this._toggleButtons();


        //scroll button list to end if bottons appeared or disappeared
        // if(_this.entitiesSelected_1 !== (_this.model.state.marker.select.length > 0)) {
        //   _this.scrollToEnd();
        // }
        // _this.entitiesSelected_1 = _this.model.state.marker.select.length > 0;
      },
      "change:ui.chart": function(evt, path) {
        if(path.indexOf("lockActive") > -1) {
          _this.setBubbleLock();
        }
      }
    }      

    // config.ui is same as this.model.ui here but this.model.ui is not yet available because constructor hasn't been called. 
    // can't call constructor earlier because this.model_binds needs to be complete before calling constructor
    config.ui.buttons.forEach(function(buttonId) {
      var button = _this._available_buttons[buttonId];
      if(button && button.statebind) {
        _this.model_binds['change:' + button.statebind] = function(evt) {
          button.statebindfunc(buttonId, evt.source.value);
        }
      }
    });    

    // builds model
    this._super(config, context);
        
    this.validatePopupButtons(this.model.ui.buttons, this.model.ui.dialogs);

  },

  readyOnce: function() {
    var _this = this;
    
    this.element = d3.select(this.placeholder);
    this.element.selectAll("div").remove();
    
    this.root.findChildByName("gapminder-dialogs").on('close', function( evt, params) {
      _this.setButtonActive(params.id, false);
    });
    
    var button_expand = (this.model.ui.dialogs||{}).sidebar || [];
    
    // // if button_expand has been passed in with boolean param or array must check and covert to array
    // if (button_expand){
    //   this.model.ui.dialogs.sidebar = (button_expand === true) ? this.model.ui.buttons : button_expand;
    // }

    // if (button_expand && button_expand.length !== 0) {
    //     d3.select(this.root.element).classed("vzb-dialog-expand-true", true);
    // }
    
    var button_list = [].concat(this.model.ui.buttons);

    // (button_expand||[]).forEach(function(button) {
    //   if (button_list.indexOf(button) === -1) {
    //     button_list.push(button);
    //   }
    // });

    this.model.ui.buttons = button_list;

    //add buttons and render components
    this._addButtons(button_list, button_expand);

    //store body overflow
    this._prev_body_overflow = document.body.style.overflow;

    this.setBubbleTrails();
    this.setBubbleLock();
    this.setInpercent();
    this.setPresentationMode();

    this._toggleButtons();

  },
  
  proceedClick: function(id) {
    var _this = this;
    var btn = _this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
      classes = btn.attr("class"),
      btn_config = _this._available_buttons[id];

    if(btn_config && btn_config.func) {
      btn_config.func(id);
    } else {
      var btn_active = classes.indexOf(class_active) === -1;

      btn.classed(class_active, btn_active);
      var evt = {};
      evt['id'] = id;
      evt['active'] = btn_active;
      _this.trigger('click', evt);
    }    
  },
  
  validatePopupButtons: function (buttons, dialogs) {
    var _this = this;
    
    var popupDialogs = dialogs.popup;
    var popupButtons = buttons.filter(function(d) {
      return (_this._available_buttons[d] && !_this._available_buttons[d].func); 
      });
    for(var i = 0, j = popupButtons.length; i < j; i++) {
       if(popupDialogs.indexOf(popupButtons[i]) == -1) {
           return utils.error('Buttonlist: bad buttons config: "' + popupButtons[i] + '" is missing in popups list');
       }
    }
    return false; //all good
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
      button.style('display', '');
    });
  },

  /*
  * determine which buttons are shown on the buttonlist
  */
  _toggleButtons: function() {
    var _this = this;
    var parent = this.parent.element.node ? this.parent.element : d3.select(this.parent.element);

    //HERE
    var button_expand = (this.model.ui.dialogs||{}).sidebar || [];
    _this._showAllButtons();

    var buttons = this.element.selectAll(".vzb-buttonlist-btn");

    var container = this.element.node().getBoundingClientRect();

    var not_required = [];
    var required = [];

    var button_width = 80;
    var button_height = 80;
    var container_width = this.element.node().getBoundingClientRect().width;
    var container_height = this.element.node().getBoundingClientRect().height;
    var buttons_width = 0;
    var buttons_height = 0;

    buttons.each(function(d,i) {
      var button_data = d;
      var button = d3.select(this);
      var expandable = button_expand.indexOf(button_data.id) !== -1;
      var button_margin = {top: parseInt(button.style("margin-top")), right: parseInt(button.style("margin-right")), left: parseInt(button.style("margin-left")), bottom: parseInt(button.style("margin-bottom"))};
      button_width = button.node().getBoundingClientRect().width + button_margin.right + button_margin.left;
      button_height = button.node().getBoundingClientRect().height + button_margin.top + button_margin.bottom;

      if(!button.classed(class_hidden)) {
        if(!expandable || (_this.getLayoutProfile() !== 'large')){
          buttons_width += button_width;
          buttons_height += button_height;
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
      }
    });
    var width_diff = buttons_width - container_width;
    var height_diff = buttons_height - container_height;
    var number_of_buttons = 1;

    //check if container is landscape or portrait
    // if portrait small or large with expand, use width
    if(parent.classed("vzb-large") && parent.classed("vzb-dialog-expand-true")
    || parent.classed("vzb-small") && parent.classed("vzb-portrait")) {
      //check if the width_diff is small. If it is, add to the container
      // width, to allow more buttons in a way that is still usable
      if(width_diff > 0 && width_diff <=10){
        container_width += width_diff;
      }
      number_of_buttons = Math.floor(container_width / button_width) - required.length;
      if(number_of_buttons < 0){
        number_of_buttons = 0;
      }
    // else, use height
    } else {
      //check if the width_diff is small. If it is, add to the container
      // width, to allow more buttons in a way that is still usable
      if(height_diff > 0 && height_diff <=10){
        container_height += height_diff;
      }
      number_of_buttons = Math.floor(container_height / button_height) - required.length;
      if(number_of_buttons < 0){
        number_of_buttons = 0;
      }
    }
    //change the display property of non required buttons, from right to
    // left
    not_required.reverse();
    var hiddenButtons = [];
    for (var i = 0, j = not_required.length - number_of_buttons; i < j ; i++) {
        not_required[i].style("display", "none");
        hiddenButtons.push(not_required[i].attr("data-btn"));
    }
    
    var evt = {};
    evt['hiddenButtons'] = hiddenButtons;
    _this.trigger('toggle', evt);

  },

  /*
   * adds buttons configuration to the components and template_data
   * @param {Array} button_list list of buttons to be added
   */
  _addButtons: function(button_list, button_expand) {
    var _this = this;
    this._components_config = [];
    var details_btns = [];
    if(!button_list.length) return;
    //add a component for each button
    for(var i = 0; i < button_list.length; i++) {

      var btn = button_list[i];
      var btn_config = this._available_buttons[btn];

      //add template data
      var d = (btn_config) ? btn : "_default";
      var details_btn = utils.clone(this._available_buttons[d]);

      details_btn.id = btn;
      details_btn.icon = iconset[details_btn.icon];
      details_btns.push(details_btn);
    };

    var t = this.getTranslationFunction(true);

    this.element.selectAll('button').data(details_btns)
      .enter().append("button")
      .attr('class', function (d) {
        var cls = 'vzb-buttonlist-btn';
        if (button_expand.length > 0) {
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

    var buttons = this.element.selectAll(".vzb-buttonlist-btn");

    //clicking the button
    buttons.on('click', function() {

      d3.event.preventDefault();
      d3.event.stopPropagation();
      
      var id = d3.select(this).attr("data-btn");
      _this.proceedClick(id);
    });

  },


  scrollToEnd: function() {
    var target = 0;
    var parent = d3.select(".vzb-tool");

    if(parent.classed("vzb-portrait") && parent.classed("vzb-small")) {
      if(this.model.state.marker.select.length > 0) target = this.element[0][0].scrollWidth
      this.element[0][0].scrollLeft = target;
    } else {
      if(this.model.state.marker.select.length > 0) target = this.element[0][0].scrollHeight
      this.element[0][0].scrollTop = target;
    }
  },


  /*
   * RESIZE:
   * Executed whenever the container is resized
   * Ideally, it contains only operations related to size
   */
  resize: function() {
    //TODO: what to do when resizing?

    //toggle presentaion off is switch to 'small' profile
    if(this.getLayoutProfile() === 'small' && this.model.ui.presentation) {
      this.togglePresentationMode();
    }

    this._toggleButtons();
  },

  setButtonActive: function(id, boolActive) {
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");

    btn.classed(class_active, boolActive);
  },

  toggleBubbleTrails: function() {
    this.model.ui.chart.trails = !this.model.ui.chart.trails;
    this.setBubbleTrails();
  },
  setBubbleTrails: function() {
    var trails = (this.model.ui.chart||{}).trails;
    if(!trails && trails !== false) return; 
    var id = "trails";
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
    if(!btn.node()) return utils.warn("setBubbleTrails: no button '" +id+ "' found in DOM. doing nothing");

    btn.classed(class_active_locked, trails);
    btn.classed(class_hidden, this.model.state.marker.select.length == 0);
  },
  toggleBubbleLock: function(id) {
    var active = (this.model.ui.chart||{}).lockActive;

    if(this.model.state.marker.select.length == 0 && !active) return;

    var locked = this.model.ui.chart.lockNonSelected;
    var time = this.model.state.time;
    locked = locked ? 0 : time.timeFormat(time.value);
    this.model.ui.chart.lockNonSelected = locked;

    this.setBubbleLock();
  },
  setBubbleLock: function() {
    var locked = (this.model.ui.chart||{}).lockNonSelected;
    var active = (this.model.ui.chart||{}).lockActive;
    if(!locked && locked !== 0) return;

    if(locked !== 0 && this.model.state.marker.select.length === 0 && !active) {
       locked = this.model.ui.chart.lockNonSelected = 0;
    }

    var id = "lock";
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
    if(!btn.node()) return utils.warn("setBubbleLock: no button '" +id+ "' found in DOM. doing nothing");
      
    var translator = this.model.locale.getTFunction();

    btn.classed(class_unavailable, this.model.state.marker.select.length == 0 && !active);
    if (typeof active == "undefined") {
      btn.classed(class_hidden, this.model.state.marker.select.length == 0);
    } else {
      btn.classed(class_hidden, !active);
    }

    btn.classed(class_active_locked, locked)
    btn.select(".vzb-buttonlist-btn-title")
      .text(locked ? locked : translator("buttons/lock"));

    btn.select(".vzb-buttonlist-btn-icon")
      .html(iconset[locked ? "lock" : "unlock"]);
  },
  toggleInpercent: function() {
    this.model.ui.chart.inpercent = !this.model.ui.chart.inpercent;
    this.setInpercent();
  },
  setInpercent: function() {
    if (typeof((this.model.ui.chart||{}).inpercent) == "undefined") return;
    var id = 'inpercent';
    var translator = this.model.locale.getTFunction();
    var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");

    btn.classed(class_active_locked, this.model.ui.chart.inpercent);
  },
  togglePresentationMode: function() {
    this.model.ui.presentation = !this.model.ui.presentation;
    this.setPresentationMode();
  },
  setPresentationMode: function() {
    var id = 'presentation';
    var translator = this.model.locale.getTFunction();
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
      component = component.parent;
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
    var translator = this.model.locale.getTFunction();
    btn.classed(class_active_locked, fs);

    btn.select(".vzb-buttonlist-btn-icon").html(iconset[fs ? "unexpand" : "expand"]);

    btn.select(".vzb-buttonlist-btn-title>span").text(
      translator("buttons/" + (fs ? "unexpand" : "expand"))
    )
    .attr("data-vzb-translate", "buttons/" + (fs ? "unexpand" : "expand"));

    //restore body overflow
    document.body.style.overflow = body_overflow;

    this.root.ui.resizeHandler();

    //force window resize event
    // utils.defer(function() {
    //   event = window.document.createEvent("HTMLEvents");
    //   event.initEvent("resize", true, true);
    //   event.eventName = "resize";
    //   window.dispatchEvent(event);
    // });
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
  } else if(document.msExitFullscreen) {
    document.msExitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

export default ButtonList;
