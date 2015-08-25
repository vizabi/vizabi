/*!
 * VIZABI DIALOG
 * Reusable Dialog component
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  Vizabi.Component.extend('gapminder-buttonlist-dialog', {
    /**
     * Initializes the dialog
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} parent Reference to tool
     */
    init: function (config, parent) {
      this.name = this.name || '';

      this.model_expects = this.model_expects || [{
          name: "state",
          type: "model"
        }, {
          name: "ui",
          type: "model"
        }, {
          name: "language",
          type: "language"
        }];

      this.template = 'src/components/_gapminder/buttonlist/' +
        'dialogs/' + this.name + '/' + this.name + '.html';

      this._super(config, parent);
    },

    /**
     * Executed when the dialog has been rendered
     */
    readyOnce: function () {
      this.element = d3.select(this.element);

    },

    ready: function () {
      this.placeholderEl = d3.select(this.placeholder);
    },

    beforeOpen: function () {
      var transitionEvents = ['webkitTransitionEnd', 'transitionend', 'msTransitionEnd', 'oTransitionEnd'];
      transitionEvents.forEach(function (event) {
        this.placeholderEl.on(event, transitionEnd.bind(this, event));
      }.bind(this));
      if (this.leftPos) {
        this.placeholderEl.style('left', this.leftPos);
      }
    },

    /**
     * User has clicked to open this dialog
     */
    open: function () {
      this.isOpen = true;
      if (this.topPos) {
        this.placeholderEl.style('top', this.topPos);
      }
    },

    beforeClose: function () {
      this.placeholderEl.classed('notransition', false);
      this.placeholderEl.style('bottom', '');
      this.placeholderEl.node().offsetHeight; // trigger a reflow (flushing the css changes)
    },

    /**
     * User has closed this dialog
     */
    close: function () {
      if (this.isOpen) {
        this.leftPos = this.placeholderEl.style('left');
        this.topPos = this.placeholderEl.style('top');
      }
      this.placeholderEl.style('top', '');
      this.isOpen = false;
    },

    resize: function () {
      var newLayout = this.getLayoutProfile();
      if (this.activeProfile != newLayout || newLayout === 'small') {
        this.activeProfile = newLayout;
        this.topPos = null;
        this.leftPos = null;
        if (this.placeholderEl) {
          this.placeholderEl.attr('style', '');
        }
      }
      if (this.placeholderEl) {
        var chartWidth = parseInt(-this.parent.parent.components[0].width, 10);
        var dialogLeft = parseInt(this.placeholderEl.style('left'), 10);
        if (utils.isNumber(dialogLeft) && dialogLeft < chartWidth) {
          this.placeholderEl.style('left', chartWidth + 'px');
        }
      }
    }

  });

}).call(this);

function transitionEnd(eventName) {
  this.placeholderEl.on(eventName, null);
  this.placeholderEl.classed('notransition', true);
}
