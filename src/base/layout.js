import * as utils from './utils';
import Events from './events';

//classes are vzb-portrait, vzb-landscape...
var class_prefix = 'vzb-';
var class_portrait = 'vzb-portrait';
var class_lansdcape = 'vzb-landscape';

var Layout = Events.extend({

  screen_profiles: {
    small: {
      min_width: 0,
      max_width: 749
    },
    medium: {
      min_width: 750,
      max_width: 969
    },
    large: {
      min_width: 970,
      max_width: Infinity
    }
  },

  /**
   * Initializes the layout manager
   */
  init: function() {
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

    utils.forEach(this.screen_profiles, function(range, size) {
      //remove class
      utils.removeClass(_this._container, class_prefix + size);
      //find best fit
      if(width >= range.min_width && width <= range.max_width) {
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
  },

  /**
   * Gets the current selected profile
   * @returns {String} name of current profile
   */
  currentProfile: function() {
    return this._curr_profile;
  },

  clear: function() {
    root.removeEventListener('resize', this.resizeHandler);
  }

});

function resize() {
  if(this._container) {
    this.setSize();
  }
}

export default Layout;