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
      var _this = this;
      this.placeholderEl = d3.select(this.placeholder);
      this.rootEl = d3.select(this.root.element);
      this.dragHandler = this.placeholderEl.select("[data-click='dragDialog']");
      this.dragHandler.html(this._icons['dragIcon']);

      var dg = dialogDrag(this.placeholderEl, d3.select('.vzb-tool-content'), 75);
      var dragBehavior = d3.behavior.drag()
        .on('dragstart', function D3dialogDragStart() {
          if (_this.rootEl.classed('vzb-portrait'))
            return;
          dg.dragStart(d3.event);
        })
        .on('drag', function D3dialogDrag() {
          if (_this.rootEl.classed('vzb-portrait'))
            return;
          dg.drag(d3.event);
        });
      this.dragHandler.call(dragBehavior);
    },

    resize: function () {
      if (this.placeholderEl) {
        var chartWidth = -parseInt(this.parent.parent.components[0].width, 10);
        var dialogLeft = parseInt(this.placeholderEl.style('left'), 10);
        if (utils.isNumber(dialogLeft) && dialogLeft < chartWidth) {
          this.placeholderEl.style('left', chartWidth + 'px');
          if (this.leftPos) {
            this.leftPos = chartWidth + 'px';
          }
        }
        if (this.rootEl.classed('vzb-portrait')) {
          this.leftPos = null;
          this.topPos = null;
          this.placeholderEl.attr('style', '');
        }
      }
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

    '_icons': {
      'dragIcon': '<svg class="vzb-icon" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 384q-53 0-90.5 37.5t-37.5 90.5v128h-32v-93q0-48-32-81.5t-80-33.5q-46 0-79 33t-33 79v429l-32-30v-172q0-48-32-81.5t-80-33.5q-46 0-79 33t-33 79v224q0 47 35 82l310 296q39 39 39 102 0 26 19 45t45 19h640q26 0 45-19t19-45v-25q0-41 10-77l108-436q10-36 10-77v-246q0-48-32-81.5t-80-33.5q-46 0-79 33t-33 79v32h-32v-125q0-40-25-72.5t-64-40.5q-14-2-23-2-46 0-79 33t-33 79v128h-32v-122q0-51-32.5-89.5t-82.5-43.5q-5-1-13-1zm0-128q84 0 149 50 57-34 123-34 59 0 111 27t86 76q27-7 59-7 100 0 170 71.5t70 171.5v246q0 51-13 108l-109 436q-6 24-6 71 0 80-56 136t-136 56h-640q-84 0-138-58.5t-54-142.5l-308-296q-76-73-76-175v-224q0-99 70.5-169.5t169.5-70.5q11 0 16 1 6-95 75.5-160t164.5-65q52 0 98 21 72-69 174-69z"/></svg>'
    }

  });

}).call(this);

function transitionEnd(eventName) {
  this.placeholderEl.on(eventName, null);
  this.placeholderEl.classed('notransition', true);
}

function dialogDrag(element, container, xOffset) {
  var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, diffX, diffY;

  return {
    move: function (x, y) {
      element.style('left', x + 'px');
      element.style('top', y + 'px');
    },

    dragStart: function (evt) {
      posX = evt.sourceEvent.clientX;
      posY = evt.sourceEvent.clientY;
      divTop = parseInt(element.style('top')) || 0;
      divLeft = parseInt(element.style('left')) || 0;
      eWi = parseInt(element.style('width'));
      eHe = parseInt(element.style('height'));
      cWi = parseInt(container.style('width')) + xOffset;
      cHe = parseInt(container.style('height'));
      diffX = posX - divLeft;
      diffY = posY - divTop;
    },

    drag: function(evt) {
      var posX = evt.sourceEvent.clientX,
        posY = evt.sourceEvent.clientY,
        aX = posX - diffX,
        aY = posY - diffY;
      if (aX > -xOffset) aX = -xOffset;
      if (aY < 0) aY = 0;
      if (-aX + eWi > cWi) aX = -cWi + eWi;
      if (eHe + aY > cHe) aY = cHe - eHe;

      this.move(aX, aY);
    }
  }
}
