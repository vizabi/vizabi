import * as utils from 'utils';
import Events from 'events';

//classes are vzb-portrait, vzb-landscape...
var class_prefix = 'vzb-';
var class_presentation = 'presentation';
var class_portrait = 'vzb-portrait';
var class_lansdcape = 'vzb-landscape';

var Layout = Events.extend({

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
      min_height: 400
    }
  },

  /**
   * Initializes the layout manager
   */
  init: function(ui) {
    this.ui = ui || {};

    this._container = null;
    //dom element
    this._curr_profile = null;
    this._prev_size = {};
    //resize when window resizes
    var _this = this;

    this.resizeHandler = this.resizeHandler || resize.bind(this);

    window.addEventListener('resize', this.resizeHandler);
    this._super();
  },

  /**
   * Calculates the size of the newly resized container
   */
  setSize: function() {
    var _this = this;
    var width = this._container.clientWidth;
    var height = this._container.clientHeight;
    if(this._prev_size && this._prev_size.width === width && this._prev_size.height === height) {
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
    if(width < height) {
      utils.addClass(this._container, class_portrait);
      utils.removeClass(this._container, class_lansdcape);
    } else {
      utils.addClass(this._container, class_lansdcape);
      utils.removeClass(this._container, class_portrait);
    }
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
    if (this.ui.presentation) {
        utils.addClass(this._container, class_prefix + class_presentation);
    } else {
        utils.removeClass(this._container, class_prefix + class_presentation);
    }
  },

  getPresentationMode: function() {
    return this.ui.presentation;
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

function resize() {
  if(this._container) {
    this.setSize();
  }
}

export default Layout;
