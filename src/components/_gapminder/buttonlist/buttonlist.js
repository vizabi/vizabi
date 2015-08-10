/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  //default existing buttons
  var class_active = "vzb-active";
  var class_active_locked = "vzb-active-locked";
  var class_unavailable = "vzb-unavailable";
  var class_vzb_fullscreen = "vzb-force-fullscreen";

  Vizabi.Component.extend('gapminder-buttonlist', {

    /**
     * Initializes the buttonlist
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, context) {

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
          dialog: true,
          ispin:false
        },
        'moreoptions': {
          title: "buttons/more_options",
          icon: "gear",
          dialog: true,
          ispin:false
        },
        'colors': {
          title: "buttons/colors",
          icon: "paint-brush",
          dialog: true,
          ispin:false
        },
        'size': {
          title: "buttons/size",
          icon: "circle",
          dialog: true,
          ispin:false
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
          dialog: true,
          ispin:false
        },
        'axes-mc': {
          title: "buttons/axes-mc",
          icon: "axes",
          dialog: true,
          ispin:false
        },
        'stack': {
          title: "buttons/stack",
          icon: "stack",
          dialog: true,
          ispin:false
        },
        '_default': {
          title: "Button",
          icon: "asterisk",
          dialog: false
        }
      };

      this._active_comp = false;

      this.model_binds = {
        "change:state:entities:select": function () {
          if (!_this._readyOnce) return;

          if (_this.model.state.entities.select.length === 0) {
            _this.model.state.time.lockNonSelected = 0;
          }
          _this.setBubbleTrails();
          _this.setBubbleLock();


          //scroll button list to end if bottons appeared or disappeared
          if (_this.entitiesSelected_1 !== (_this.model.state.entities.select.length > 0)) {
            _this.scrollToEnd();
          }
          _this.entitiesSelected_1 = _this.model.state.entities.select.length > 0;
        }
      }

      this._super(config, context);

    },

    readyOnce: function () {

      var _this = this;

      this.element = d3.select(this.element);
      this.buttonContainerEl = this.element.append("div")
        .attr("class", "vzb-buttonlist-container-buttons");
      this.dialogContainerEl = this.element.append("div")
        .attr("class", "vzb-buttonlist-container-dialogs");

      //add buttons and render components
      if (this.model.ui.buttons) {
        this._addButtons();
      }

      var buttons = this.element.selectAll(".vzb-buttonlist-btn");

      //activate each dialog when clicking the button
      buttons.on('click', function () {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        var btn = d3.select(this),
          id = btn.attr("data-btn"),
          classes = btn.attr("class"),
          btn_config = _this._available_buttons[id];

        //if it's a dialog, open
        if (btn_config && btn_config.dialog) {
          //close if it's open
          if (classes.indexOf(class_active) !== -1) {
            _this.closeDialog(id);
          } else {
            _this.openDialog(id);
          }
        }
        //otherwise, execute function
        else if (btn_config.func) {
          btn_config.func(id);
        }

      });

      var close_buttons = this.element.selectAll("[data-click='closeDialog']");
      close_buttons.on('click', function () {
        _this.closeAllDialogs();
      });
      var pinDialog = this.element.selectAll("[data-click='pinDialog']");
      pinDialog.on('click', function () {
        _this.pinDialog(this);
      });

       d3.selectAll(".vzb-buttonlist-container-dialogs").on('click', function(){
         d3.event.preventDefault();
         d3.event.stopPropagation();
       });

      this.root.element.addEventListener('click', function(){
        _this.closeAllDialogs();
      });

      //store body overflow
      this._prev_body_overflow = document.body.style.overflow;

      this.setBubbleTrails();
      this.setBubbleLock();

      d3.select(this.root.element).on("mousedown", function (e) {
        if(!this._active_comp) return; //don't do anything if nothing is open

  			var target = d3.event.target;
        var closeDialog = true;
  			while (target)
  			{
          if(target.classList.contains("vzb-dialog-modal"))
          {
            closeDialog = false;
            break;
          }
  				target = target.parentElement;
  			}
  			if(closeDialog)
        {
          _this.closeAllDialogs();
        }
  		});
    },


    /*
     * adds buttons configuration to the components and template_data
     * @param {Array} button_list list of buttons to be added
     */
    _addButtons: function () {

      this._components_config = [];
      var button_list = this.model.ui.buttons;
      var details_btns = [];
      if (!button_list.length) return;
      //add a component for each button
      for (var i = 0; i < button_list.length; i++) {

        var btn = button_list[i];
        var btn_config = this._available_buttons[btn];

        //if it's a dialog, add component
        if (btn_config && btn_config.dialog) {
          var comps = this._components_config;

          //add corresponding component
          comps.push({
            component: 'gapminder-buttonlist-' + btn,
            placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]',
            model: ["state", "ui", "language"]
          });

          btn_config.component = comps.length - 1;
        }

        //add template data
        var d = (btn_config) ? btn : "_default";
        var details_btn = this._available_buttons[d];

        details_btn.id = btn;
        details_btn.icon = this._icons[details_btn.icon];
        details_btns.push(details_btn);
      }
      ;

      var t = this.getTranslationFunction(true);

      this.buttonContainerEl.selectAll('button').data(details_btns)
        .enter().append("button")
        .attr('class', 'vzb-buttonlist-btn')
        .attr('data-btn', function (d) {
          return d.id;
        })
        .html(function (btn) {
          return "<span class='vzb-buttonlist-btn-icon fa'>" +
            btn.icon + "</span><span class='vzb-buttonlist-btn-title'>" +
            t(btn.title) + "</span>";
        });

      this.dialogContainerEl.selectAll('div').data(details_btns)
        .enter().append("div")
        .attr('class', 'vzb-buttonlist-dialog')
        .attr('data-btn', function (d) {
          return d.id;
        });

      this.loadComponents();

      var _this = this;
      //render each subcomponent
      utils.forEach(this.components, function (subcomp) {
        subcomp.render();
        _this.on('resize', function () {
          subcomp.trigger('resize');
        });
      });
    },


    scrollToEnd: function () {
      var target = 0;
      var parent = d3.select(".vzb-tool");

      if (parent.classed("vzb-portrait") && parent.classed("vzb-small")) {
        if (this.model.state.entities.select.length > 0) target = this.buttonContainerEl[0][0].scrollWidth
        this.buttonContainerEl[0][0].scrollLeft = target;
      } else {
        if (this.model.state.entities.select.length > 0) target = this.buttonContainerEl[0][0].scrollHeight
        this.buttonContainerEl[0][0].scrollTop = target;
      }
    },


    /*
     * RESIZE:
     * Executed whenever the container is resized
     * Ideally, it contains only operations related to size
     */
    resize: function () {
      //TODO: what to do when resizing?
    },

    //TODO: make opening/closing a dialog via update and model
    /*
     * Activate a button dialog
     * @param {String} id button id
     */
    openDialog: function (id) {

        this.closeAllDialogs(true);

      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
        dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

      //add classes
      btn.classed(class_active, true);
      dialog.classed(class_active, true);

      this._active_comp = this.components[this._available_buttons[id].component];
      //call component function
      this._active_comp.open();
    },


      pinDialog: function (button) {
        var id = button.getAttribute('data-dialogtype');
        var btn = this.element.select(".vzb-buttonlist-btn[data-btn='" + id + "']");
        var dialog = this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']");
        if(this._available_buttons[id].ispin){
         // button.textContent = '';
          btn.classed('pinned', false);
          this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']").classed('pinned', false);
          this._available_buttons[id].ispin = false;
        } else {
        //  button.textContent = '';
          btn.classed('pinned', true);
          dialog.classed('pinned', true);
          this._available_buttons[id].ispin = true;
        }
      },


    /*
     * Closes a button dialog
     * @param {String} id button id
     */
    closeDialog: function (id) {

      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
        dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

      //remove classes
      btn.classed(class_active, false);
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
    closeAllDialogs: function (forceclose) {
      //remove classes
      var btnClass = forceclose ? ".vzb-buttonlist-btn" : ".vzb-buttonlist-btn:not(.pinned)"
      var dialogClass = forceclose ? ".vzb-buttonlist-dialog" : ".vzb-buttonlist-dialog:not(.pinned)"
      var all_btns = this.element.selectAll(btnClass),
        all_dialogs = this.element.selectAll(dialogClass);
      all_btns.classed(class_active, false);
      all_dialogs.classed(class_active, false);

      //call component close function
      if (this._active_comp) {
        this._active_comp.close();
      }
      this._active_comp = false;
      this.model.state.entities.setNeedUpdate();
    },

    toggleBubbleTrails: function () {
      this.model.state.time.trails = !this.model.state.time.trails;
      this.setBubbleTrails();
    },
    setBubbleTrails: function () {
      var id = "trails";
      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");

      btn.classed(class_active_locked, this.model.state.time.trails);
      btn.style("display", this.model.state.entities.select.length == 0 ? "none" : "inline-block")
    },
    toggleBubbleLock: function (id) {
      if (this.model.state.entities.select.length == 0) return;

      var timeFormatter = d3.time.format(this.model.state.time.formatInput);
      var locked = this.model.state.time.lockNonSelected;
      locked = locked ? 0 : timeFormatter(this.model.state.time.value);
      this.model.state.time.lockNonSelected = locked;

      this.setBubbleLock();
    },
    setBubbleLock: function () {
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
        .html(this._icons[locked ? "lock" : "unlock"]);
    },
    toggleFullScreen: function (id) {

      var component = this;
      var pholder = component.placeholder;
      var pholder_found = false;
      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
      var fs = !this.model.ui.fullscreen;
      var body_overflow = (fs) ? "hidden" : this._prev_body_overflow;

      while (!(pholder_found = utils.hasClass(pholder, 'vzb-placeholder'))) {
        component = this.parent;
        pholder = component.placeholder;
      }

      //TODO: figure out a way to avoid fullscreen resize delay in firefox
      if (fs) {
        launchIntoFullscreen(pholder);
        subscribeFullscreenChangeEvent.call(this, this.toggleFullScreen.bind(this, id));
      } else {
        exitFullscreen.call(this);
      }

      utils.classed(pholder, class_vzb_fullscreen, fs);
      this.model.ui.fullscreen = fs;
      var translator = this.model.language.getTFunction();
      btn.classed(class_active_locked, fs);

      btn.select(".vzb-buttonlist-btn-icon").html(this._icons[fs ? "unexpand" : "expand"]);
      btn.select(".vzb-buttonlist-btn-title").text(
        translator("buttons/" + (fs ? "unexpand" : "expand"))
      );

      //restore body overflow
      document.body.style.overflow = body_overflow;

      //force window resize event
      (function () {
        event = root.document.createEvent("HTMLEvents");
        event.initEvent("resize", true, true);
        event.eventName = "resize";
        root.dispatchEvent(event);
      })();

    },

    //TODO: figure out a better way to tempate the icons
    // SVG VIZABI ICONS
    // source: https://github.com/encharm/Font-Awesome-SVG-PNG/
    _icons: {
      'paint-brush': '<svg class="vzb-icon vzb-icon-paint-brush" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1615 0q70 0 122.5 46.5t52.5 116.5q0 63-45 151-332 629-465 752-97 91-218 91-126 0-216.5-92.5t-90.5-219.5q0-128 92-212l638-579q59-54 130-54zm-909 1034q39 76 106.5 130t150.5 76l1 71q4 213-129.5 347t-348.5 134q-123 0-218-46.5t-152.5-127.5-86.5-183-29-220q7 5 41 30t62 44.5 59 36.5 46 17q41 0 55-37 25-66 57.5-112.5t69.5-76 88-47.5 103-25.5 125-10.5z"/></svg>',
      'search': '<svg class="vzb-icon vzb-icon-search" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1216 832q0-185-131.5-316.5t-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5 316.5-131.5 131.5-316.5zm512 832q0 52-38 90t-90 38q-54 0-90-38l-343-342q-179 124-399 124-143 0-273.5-55.5t-225-150-150-225-55.5-273.5 55.5-273.5 150-225 225-150 273.5-55.5 273.5 55.5 225 150 150 225 55.5 273.5q0 220-124 399l343 343q37 37 37 90z"/></svg>',
      'circle': '<svg class="vzb-icon vzb-icon-circle" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1664 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>',
      'expand': '<svg class="vzb-icon vzb-icon-expand" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M883 1056q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23zm781-864v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45z"/></svg>',
      'asterisk': '<svg class="vzb-icon vzb-icon-asterisk" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1546 1050q46 26 59.5 77.5t-12.5 97.5l-64 110q-26 46-77.5 59.5t-97.5-12.5l-266-153v307q0 52-38 90t-90 38h-128q-52 0-90-38t-38-90v-307l-266 153q-46 26-97.5 12.5t-77.5-59.5l-64-110q-26-46-12.5-97.5t59.5-77.5l266-154-266-154q-46-26-59.5-77.5t12.5-97.5l64-110q26-46 77.5-59.5t97.5 12.5l266 153v-307q0-52 38-90t90-38h128q52 0 90 38t38 90v307l266-153q46-26 97.5-12.5t77.5 59.5l64 110q26 46 12.5 97.5t-59.5 77.5l-266 154z"/></svg>',
      'trails': '<svg class="vzb-icon vzb-icon-trails" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1344 1024q133 0 226.5 93.5t93.5 226.5-93.5 226.5-226.5 93.5-226.5-93.5-93.5-226.5q0-12 2-34l-360-180q-92 86-218 86-133 0-226.5-93.5t-93.5-226.5 93.5-226.5 226.5-93.5q126 0 218 86l360-180q-2-22-2-34 0-133 93.5-226.5t226.5-93.5 226.5 93.5 93.5 226.5-93.5 226.5-226.5 93.5q-126 0-218-86l-360 180q2 22 2 34t-2 34l360 180q92-86 218-86z"/></svg>',
      'lock': '<svg class="vzb-icon vzb-icon-lock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M640 768h512v-192q0-106-75-181t-181-75-181 75-75 181v192zm832 96v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-192q0-184 132-316t316-132 316 132 132 316v192h32q40 0 68 28t28 68z"/></svg>',
      'unlock': '<svg class="vzb-icon vzb-icon-unlock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1376 768q40 0 68 28t28 68v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-320q0-185 131.5-316.5t316.5-131.5 316.5 131.5 131.5 316.5q0 26-19 45t-45 19h-64q-26 0-45-19t-19-45q0-106-75-181t-181-75-181 75-75 181v320h736z"/></svg>',
      'unexpand': '<svg class="vzb-icon vzb-icon-unexpand" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 960v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45zm755-672q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23z"/></svg>',
      'axes': '<svg class="vzb-icon vzb-icon-axes" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path d="M430.25,379.655l-75.982-43.869v59.771H120.73V151.966h59.774l-43.869-75.983L92.767,0L48.898,75.983L5.029,151.966h59.775 v271.557c0,15.443,12.52,27.965,27.963,27.965h261.5v59.773l75.982-43.869l75.982-43.867L430.25,379.655z"/></svg>',
      'gear': '<svg class="vzb-icon vzb-icon-gear" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>',
      'stack': '<svg class="vzb-icon vzb-icon-stack" viewBox="0 0 54.849 54.849" xmlns="http://www.w3.org/2000/svg"><g><path d="M54.497,39.614l-10.363-4.49l-14.917,5.968c-0.537,0.214-1.165,0.319-1.793,0.319c-0.627,0-1.254-0.104-1.79-0.318     l-14.921-5.968L0.351,39.614c-0.472,0.203-0.467,0.524,0.01,0.716L26.56,50.81c0.477,0.191,1.251,0.191,1.729,0L54.488,40.33     C54.964,40.139,54.969,39.817,54.497,39.614z"/><path d="M54.497,27.512l-10.364-4.491l-14.916,5.966c-0.536,0.215-1.165,0.321-1.792,0.321c-0.628,0-1.256-0.106-1.793-0.321     l-14.918-5.966L0.351,27.512c-0.472,0.203-0.467,0.523,0.01,0.716L26.56,38.706c0.477,0.19,1.251,0.19,1.729,0l26.199-10.479     C54.964,28.036,54.969,27.716,54.497,27.512z"/><path d="M0.361,16.125l13.662,5.465l12.537,5.015c0.477,0.191,1.251,0.191,1.729,0l12.541-5.016l13.658-5.463     c0.477-0.191,0.48-0.511,0.01-0.716L28.277,4.048c-0.471-0.204-1.236-0.204-1.708,0L0.351,15.41     C-0.121,15.614-0.116,15.935,0.361,16.125z"/></g></svg>'
    }

  });

  function isFullscreen() {
    if (root.document.webkitIsFullScreen !== undefined)
      return root.document.webkitIsFullScreen;
    if (root.document.mozFullScreen !== undefined)
      return root.document.mozFullScreen;
    if (root.document.msFullscreenElement !== undefined)
      return root.document.msFullscreenElement;

    return false;
  }

  function exitHandler(emulateClickFunc)
  {
    if (!isFullscreen())
    {
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
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  }

  function exitFullscreen() {
    removeFullscreenChangeEvent.call(this);

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

}).call(this);
