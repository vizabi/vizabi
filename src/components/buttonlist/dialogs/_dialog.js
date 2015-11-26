import * as utils from 'base/utils';
import Component from 'base/component';
import { drag as iconDrag, pin as iconPin } from 'base/iconset'

/*!
 * VIZABI DIALOG
 * Reusable Dialog component
 */

var Dialog = Component.extend({
  /**
   * Initializes the dialog
   * @param {Object} config Initial config, with name and placeholder
   * @param {Object} parent Reference to tool
   */
  init: function(config, parent) {
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

    this.template = this.name + '.html';

    this._super(config, parent);
  },

  /**
   * Executed when the dialog has been rendered
   */
  readyOnce: function() {
    this.element = d3.select(this.element);
  },

  ready: function() {
    var _this = this;
    this.placeholderEl = d3.select(this.placeholder);
    this.rootEl = d3.select(this.root.element);
    this.dragHandler = this.placeholderEl.select("[data-click='dragDialog']");
    this.dragHandler.html(iconDrag);
    this.pinIcon = this.placeholderEl.select("[data-click='pinDialog']");
    this.pinIcon.html(iconPin);
    this.dragContainerEl = d3.select('.vzb-tool-stage');
    var profile = this.getLayoutProfile();

    this.placeholderEl.selectAll('.vzb-dialog-scrollable')
      .each(function() {
        var _this = this, elem = d3.select(this);
        preventAncestorScrolling(elem);
      });

    var dg = dialogDrag(this.placeholderEl, this.dragContainerEl, 130);
    var dragBehavior = d3.behavior.drag()
      .on('dragstart', function D3dialogDragStart() {
        _this.trigger('dragstart');
        dg.dragStart(d3.event);
      })
      .on('drag', function D3dialogDrag() {
        _this.trigger('drag');
        dg.drag(d3.event);
      })
      .on('dragend', function D3dialogDrag() {
        _this.trigger('dragend');
        _this.leftPos = _this.placeholderEl.style('left');
        _this.topPos = _this.placeholderEl.style('top');
      });
    this.dragHandler.call(dragBehavior);

    this.dragHandler.classed("vzb-hidden", profile === 'small');
    this.pinIcon.classed("vzb-hidden", profile === 'small');
    this.resize();
  },

  resize: function() {
    if(this.placeholderEl) {
      var profile = this.getLayoutProfile();
      var chartWidth = -parseInt(this.dragContainerEl.style('width'), 10);
      var dialogLeft = parseInt(this.placeholderEl.style('left'), 10);
      var chartHeight = parseInt(this.rootEl.style('height'), 10);
      var dialogTop = parseInt(this.placeholderEl.style('top'), 10);
      var dialogWidth = parseInt(this.placeholderEl.style('width'), 10);
      var dialogHeight = parseInt(this.placeholderEl.style('height'), 10);
      if(utils.isNumber(dialogLeft) && dialogLeft < chartWidth + dialogWidth * .5) {
        if(this.leftPos) {
          this.leftPos = (chartWidth + dialogWidth * .5) + 'px';
          this.placeholderEl.style('left', this.leftPos);
        }
      }
      if(utils.isNumber(dialogTop) && utils.isNumber(dialogHeight) && dialogTop >= 0 && dialogTop > chartHeight - dialogHeight) {
        if(this.topPos) {
          this.topPos = ((chartHeight - dialogHeight) > 0 ? (chartHeight - dialogHeight) : 0)  + 'px';
        }
      }
      if(profile === 'small') {
        this.leftPos = '';
        this.topPos = '';
        this.placeholderEl.attr('style', '');
      } else {
        if(this.rootEl.classed('vzb-landscape')) {
          var contentHeight = parseInt(this.rootEl.style('height'));
          var placeholderHeight = parseInt(this.placeholderEl.style('height'));
          if (contentHeight < placeholderHeight) {
            this.topPos = (-contentHeight + 50) + 'px';
            this.leftPos = '';
            this.placeholderEl.style('left', this.leftPos);
            this.placeholderEl.style('bottom', 'auto');
          } else {
            //this.topPos = '';
            this.placeholderEl.style('bottom', '');
          }
        }
        this.placeholderEl.style('top', this.topPos);
      }

      this.dragHandler.classed("vzb-hidden", profile === 'small');
      this.pinIcon.classed("vzb-hidden", profile === 'small');

    }
  },

  beforeOpen: function() {
    var _this = this;

    this.transitionEvents = ['webkitTransitionEnd', 'transitionend', 'msTransitionEnd', 'oTransitionEnd'];
    this.transitionEvents.forEach(function(event) {
      _this.placeholderEl.on(event, _this.transitionEnd.bind(_this, event));
    });
    if(this.leftPos && this.getLayoutProfile() !== 'small') {
      this.placeholderEl.style('left', this.leftPos);
    }
    if(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small') {
      this.placeholderEl.style('top', ''); // issues: 369 & 442
    } else if(this.rootEl.classed('vzb-landscape')) { // need to recalculate popup position (Safari 8 bug)
      var contentHeight = parseInt(this.rootEl.style('height'));
      var placeholderHeight = parseInt(this.placeholderEl.style('height'));
      if (contentHeight < placeholderHeight) {
        this.topPos = (-contentHeight + 50) + 'px';
        this.leftPos = '';
        this.placeholderEl.style('left', this.leftPos);
        this.placeholderEl.style('bottom', 'auto');
      } else {
        this.topPos = '';
        this.placeholderEl.style('bottom', '');
      }
      this.placeholderEl.style('top', this.topPos);
    }

  },

  /**
   * User has clicked to open this dialog
   */
  open: function() {
    this.isOpen = true;
    if(this.topPos && !(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small')) {
      this.placeholderEl.style('top', this.topPos);
    }
  },

  beforeClose: function() {
    if(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small') {
      this.placeholderEl.style('top', 'auto'); // issues: 369 & 442
    }
    this.placeholderEl.classed('notransition', false);
    this.placeholderEl.node().offsetHeight; // trigger a reflow (flushing the css changes)
  },

  /**
   * User has closed this dialog
   */
  close: function() {
    if(this.isOpen && !(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small')) {
      this.leftPos = this.placeholderEl.style('left');
      var topPos = this.placeholderEl.style('top');
      if( topPos.charAt(0) !== "-") this.topPos = topPos;
    }
    if(!(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small')) {
      this.placeholderEl.style('top', ''); // issues: 369 & 442
    }
    this.isOpen = false;
  },


  transitionEnd: function(eventName) {
    var _this = this;

    this.transitionEvents.forEach(function(event) {
      _this.placeholderEl.on(event, null);
    });
    this.placeholderEl.classed('notransition', true);
  }

});

function preventAncestorScrolling(element) {
  var preventScrolling = false;
  element.on('mousewheel', function(d, i) {
      var scrollTop = this.scrollTop,
      scrollHeight = this.scrollHeight,
      height = element.node().offsetHeight,
      delta = d3.event.wheelDelta,
      up = delta > 0;
    var prevent = function() {
      d3.event.stopPropagation();
      d3.event.preventDefault();
      d3.event.returnValue = false;
      return false;
    };
    var scrollTopTween = function(scrollTop) {
      return function () {
        var i = d3.interpolateNumber(this.scrollTop, scrollTop);
        return function (t) {
          this.scrollTop = i(t);
        };
      }
    };
    if (!up) {
      // Scrolling down
      if (-delta > scrollHeight - height - scrollTop && scrollHeight != height + scrollTop) {
        element.transition().delay(0).duration(0).tween("scrolltween", scrollTopTween(scrollHeight));
        //freeze scrolling on 2 seconds on bottom position
        preventScrolling = true;
        setTimeout(function() {
          preventScrolling = false;
        }, 2000);
      } else if (scrollTop == 0) { //unfreeze when direction changed
        preventScrolling = false;
      }
    } else if (up) {
      // Scrolling up
      if (delta > scrollTop && scrollTop > 0) { //
        //freeze scrolling on 2 seconds on top position
        element.transition().delay(0).duration(0).tween("scrolltween", scrollTopTween(0));
        preventScrolling = true;
        setTimeout(function() {
          preventScrolling = false;
        }, 2000);
      } else if (scrollHeight == height + scrollTop) { //unfreeze when direction changed
        preventScrolling = false;
      }
    }
    if (preventScrolling) {
      return prevent();
    }
  });
}

function dialogDrag(element, container, xOffset) {
  var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, diffX, diffY;

  return {
    move: function(x, y) {
      element.style('left', x + 'px');
      element.style('top', y + 'px');
    },

    dragStart: function(evt) {
      if(!utils.isTouchDevice()) {
        posX = evt.sourceEvent.clientX;
        posY = evt.sourceEvent.clientY;
      } else {
        var touchCoord = d3.touches(container.node());
        posX = touchCoord[0][0];
        posY = touchCoord[0][1];
      }
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
      if(!utils.isTouchDevice()) {
        posX = evt.sourceEvent.clientX;
        posY = evt.sourceEvent.clientY;
      } else {
        var touchCoord = d3.touches(container.node());
        posX = touchCoord[0][0];
        posY = touchCoord[0][1];
      }
      var aX = posX - diffX,
      aY = posY - diffY;
      if(aX > -xOffset) aX = -xOffset;
      if(aY < 0) aY = 0;
      if(-aX + eWi > cWi) aX = -cWi + eWi;
      if(eHe + aY > cHe) aY = cHe - eHe;

      this.move(aX, aY);
    }
  }
}

export default Dialog;
