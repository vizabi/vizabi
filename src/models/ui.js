import * as utils from 'base/utils';
import Model from 'base/model';

//classes are vzb-portrait, vzb-landscape...
var class_prefix = 'vzb-';
var class_presentation = 'presentation';
var class_rtl = 'rtl';
var class_portrait = 'vzb-portrait';
var class_landscape = 'vzb-landscape';

var UI = Model.extend({

  screen_profiles: {
    small: {
      min_width: 0,
      min_height: 0
    },
    medium: {
      min_width: 600,
      min_height: 400
    },
    large: {
      min_width: 900,
      min_height: 520
    }
  },

  getClassDefaults: function() { 
    var defaults = {
      presentation: false,
      buttons: [],
      dialogs: {
        popup: [],
        sidebar: [],
        moreoptions: []
      },
      splash: false
    };
    return utils.deepExtend(this._super(), defaults);
  },

  /**
   * Initializes the layout manager
   */
  init: function(name, values, parent, bind) {

    this._type = 'ui';
    this._container = null;
    //dom element
    this._curr_profile = null;
    this._prev_size = {};

    //resize when window resizes
    window.addEventListener('resize', this.resizeHandler.bind(this));
    bind['change:presentation'] = this.updatePresentation.bind(this);

    this._super(name, values, parent, bind);
  },

  resizeHandler: function() {
    if(this._container) {
      this.setSize();
    }
  },

  /**
   * Calculates the size of the newly resized container
   */
  setSize: function(force) {
    var _this = this;
    var width = this._container.clientWidth;
    var height = this._container.clientHeight;

    /**
     * issue #1118
     * check if device is iPhone then add top margin for searchbar if it visible
     */
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) // browser is safari
      && navigator.userAgent.match(/iPhone/i) // checking device
    ) {
      this._container.style.top =  0;
      if (this._container.clientWidth > this._container.clientHeight // landscape mode
        && this._container.clientWidth < 700) {  // small device
        var bodyHeight = this._container.clientHeight;
        var windowHeight = window.innerHeight;
        if (2 < (bodyHeight - windowHeight) && (bodyHeight - windowHeight) <= 45) { // check searchbar is visible
          this._container.style.top =  44 + "px";
          document.body.scrollTop = 44; // scrolling empty space
        }
      }
    }

    if(!force && this._prev_size && this._prev_size.width === width && this._prev_size.height === height) {
      return;
    }

    // choose profile depending on size
    utils.forEach(this.screen_profiles, function(range, size) {
      //remove class
      utils.removeClass(_this._container, class_prefix + size);
      //find best fit
      if(width >= range.min_width && height >= range.min_height) {
        _this._curr_profile = size;
      }
    });

    //update size class
    utils.addClass(this._container, class_prefix + this._curr_profile);
    
    //toggle, untoggle classes based on orientation
    utils.classed(this._container, class_portrait, width < height);
    utils.classed(this._container, class_landscape, !(width < height));

    this._prev_size.width = width;
    this._prev_size.height = height;
    this.trigger('resize');
  },

  /**
   * Sets the container for this layout
   * @param container DOM element
   */
  setContainer: function(container) {
    this._container = container;
    this.setSize();
    this.updatePresentation();
  },

  /**
   * Sets the presentation mode for this layout
   * @param {Bool} presentation mode on or off
   */
  updatePresentation: function() {
    utils.classed(this._container, class_prefix + class_presentation, this.presentation);
    this.trigger('resize');
  },

  getPresentationMode: function() {
    return this.presentation;
  },

  setRTL: function(flag) {
    utils.classed(this._container, class_prefix + class_rtl, flag);
  },

  /**
   * Gets the current selected profile
   * @returns {String} name of current profile
   */
  currentProfile: function() {
    return this._curr_profile;
  },

  clear: function() {
    window.removeEventListener('resize', this.resizeHandler);
  }

});

export default UI;
