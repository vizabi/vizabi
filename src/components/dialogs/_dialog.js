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
      type: "ui"
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
    this.dragContainerEl = d3.select('.vzb-tool');
    this.bottomPos = '';
    var profile = this.getLayoutProfile();

    var dg = dialogDrag(this.placeholderEl, this.dragContainerEl, 10);
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
        _this.rightPos = _this.placeholderEl.style('right');
        _this.bottomPos = _this.placeholderEl.style('bottom');
      });
    this.dragHandler.call(dragBehavior);

    this.dragHandler.classed("vzb-hidden", profile === 'small');
    this.pinIcon.classed("vzb-hidden", profile === 'small');
    this.resize();
  },

  resize: function() {
    if(this.placeholderEl && this.dragContainerEl) {
      var profile = this.getLayoutProfile();
      var chartWidth = parseInt(this.dragContainerEl.style('width'), 10);
      var dialogRight = parseInt(this.rightPos, 10);
      var chartHeight = parseInt(this.rootEl.style('height'), 10);
      var dialogTop = parseInt(this.bottomPos, 10);
      var dialogWidth = parseInt(this.placeholderEl.style('width'), 10);
      var dialogHeight = parseInt(this.placeholderEl.style('height'), 10);
      var dialogRightMargin = parseInt(this.placeholderEl.style('margin-right'), 10) || 0;
      if(utils.isNumber(dialogRight) && dialogRight > chartWidth - dialogWidth - dialogRightMargin) {
        if(this.rightPos) {
          this.rightPos = (chartWidth - dialogWidth - dialogRightMargin) + 'px';
          if(this.isOpen) this.placeholderEl.style('right', this.rightPos);
        }
      }
      if(utils.isNumber(dialogTop) && utils.isNumber(dialogHeight) && dialogTop >= 0 && dialogTop > chartHeight - dialogHeight) {
        if(this.bottomPos) {
          this.bottomPos = ((chartHeight - dialogHeight) > 0 ? (chartHeight - dialogHeight) : 0)  + 'px';
          if(this.isOpen) this.placeholderEl.style('bottom', this.bottomPos);
        }
      }
      if(!this.bottomPos && this.isOpen) {
        if(!(this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true"))) {
          var contentHeight = parseInt(this.rootEl.style('height'));
          var placeholderHeight = parseInt(this.placeholderEl.style('height'));
          var topPos = (contentHeight - placeholderHeight - 20) + 'px';
          this.placeholderEl.style('bottom', topPos);        
        } else { 
          this.placeholderEl.style('bottom', '');        
        }
      }

      if(profile === 'small') {
        this.rightPos = '';
        this.bottomPos = '';
        this.placeholderEl.attr('style', '');
      } else {
        if(!this.isOpen) this.placeholderEl.style('right', '');
            
        if(this.rootEl.classed('vzb-landscape')) {
          // var contentHeight = parseInt(this.rootEl.style('height'));
          // var placeholderHeight = parseInt(this.placeholderEl.style('height'));
          // if (contentHeight < placeholderHeight) {
          //   this.bottomPos = (-contentHeight + 50) + 'px';
          //   this.rightPos = '';
          //   this.placeholderEl.style('right', this.rightPos);
          //   this.placeholderEl.style('bottom', 'auto');
          // } else {
          //   //this.bottomPos = '';
          //   this.placeholderEl.style('bottom', '');
          // }
        }
        //this.placeholderEl.style('bottom', this.bottomPos);
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

    if(this.rightPos && this.getLayoutProfile() !== 'small' && !(this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true"))) {
      this.placeholderEl.classed('notransition', true);
      this.placeholderEl.style('right', this.rightPos);
      this.placeholderEl.node().offsetHeight; // trigger a reflow (flushing the css changes)
      this.placeholderEl.classed('notransition', false);
    }
    if(this.getLayoutProfile() === 'small') {
      this.placeholderEl.style('top', ''); // issues: 369 & 442
    } else if(this.rootEl.classed('vzb-landscape')) { // need to recalculate popup position (Safari 8 bug)
      // var contentHeight = parseInt(this.rootEl.style('height'));
      // var placeholderHeight = parseInt(this.placeholderEl.style('height'));
      // if (contentHeight < placeholderHeight) {
      //   this.bottomPos = (-contentHeight + 50) + 'px';
      //   this.rightPos = '';
      //   this.placeholderEl.style('right', this.rightPos);
      //   this.placeholderEl.style('bottom', 'auto');
      // } else {
      //   this.bottomPos = '';
      //   this.placeholderEl.style('bottom', '');
      // }
      //this.placeholderEl.style('bottom', this.bottomPos);
    }
    
  },

  /**
   * User has clicked to open this dialog
   */
  open: function() {
    this.isOpen = true;
    if(this.getLayoutProfile() !== 'small') {
      if(this.bottomPos) {
        this.placeholderEl.style('bottom', this.bottomPos);
        this.placeholderEl.style('right', this.rightPos);
      } else if(!(this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true"))) {
        var contentHeight = parseInt(this.rootEl.style('height'));
        var placeholderHeight = parseInt(this.placeholderEl.style('height'));
        var topPos = (contentHeight - placeholderHeight - 20) + 'px';
        this.placeholderEl.style('bottom', topPos);        
      }
    }
  },

  beforeClose: function() {
//issues: 369 & 442
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
//issues: 369 & 442
    if(!(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small')) {
      this.placeholderEl.style('bottom', ''); // issues: 369 & 442
    }
    
    if(this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true")) {
      this.placeholderEl.style('right', '');    
    }
    this.isOpen = false;
    this.trigger('close');
  },


  transitionEnd: function(eventName) {
    var _this = this;

    this.transitionEvents.forEach(function(event) {
      _this.placeholderEl.on(event, null);
    });
    if(this.isOpen) {
      this.placeholderEl.classed('notransition', true);
    }
  }

});

function dialogDrag(element, container, xOffset) {
  var posX, posY, divTop, divRight, marginRight, eWi, eHe, cWi, cHe, diffX, diffY;

  return {
    move: function(x, y) {
      element.style('right', x + 'px');
      element.style('bottom', y + 'px');
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
      divTop = parseInt(element.style('bottom')) || 0;
      divRight = parseInt(element.style('right')) || 0;
      marginRight = parseInt(element.style('margin-right')) || 0;
      eWi = parseInt(element.style('width'));
      eHe = parseInt(element.style('height'));
      cWi = parseInt(container.style('width')) - marginRight;
      cHe = parseInt(container.style('height'));
      diffX = posX + divRight;
      diffY = posY + divTop;
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
      var aX = -posX + diffX,
        aY = -posY + diffY;
      if(aX < -xOffset) aX = -xOffset;
      if(aY < 0) aY = 0;
      if(aX + eWi > cWi) aX = cWi - eWi;
      if(aY + eHe > cHe) aY = cHe - eHe;

      this.move(aX, aY);
    }
  }
}

export default Dialog;
