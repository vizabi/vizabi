import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import {
  simpleslider,
  bubblesize,
  colorlegend,
  indicatorpicker,
  simplecheckbox,
  minmaxinputs
}
from 'components/_index';

import {
  optionsbuttonlist
}
from 'components/buttonlist/_index';

/*
 * More options dialog
 */

var MoreOptions = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'moreoptions';
    
    //specifying components
    this.components = [{
      component: optionsbuttonlist,
      placeholder: '.vzb-dialog-options-buttonlist',
      model: ['state', 'ui', 'language']
    }];

    this._super(config, parent);
  },

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);
    this.contentEl = this.element.select('.vzb-dialog-content');

    this.on('dragend', function() {
      _this._setMaxHeight();
    });
        
    var dialog_popup = (this.model.ui.dialogs||{}).popup || [];
    var dialog_moreoptions = (this.model.ui.dialogs||{}).moreoptions || [];
            
    // if dialog_moreoptions has been passed in with boolean param or array must check and covert to array
    if (dialog_moreoptions === true) {
      dialog_moreoptions = dialog_popup;
      (this.model.ui.dialogs||{}).moreoptions = dialog_moreoptions;
    }
    
    this._addDialogs(dialog_moreoptions);
    
    //accordion
    this.accordionEl = this.element.select('.vzb-accordion');
    if(this.accordionEl) {
      var titleEl = this.accordionEl.selectAll('.vzb-accordion-section')
        .select('.vzb-dialog-title>span:first-child')
      titleEl.on('click', function(d) {
        var element = _this.components[d.component].element;
        var sectionEl = _this.components[d.component].placeholderEl;
        var activeEl = _this.accordionEl.select('.vzb-accordion-active');
        if(activeEl) {
          activeEl.classed('vzb-accordion-active', false);
        }
        if(sectionEl.node() !== activeEl.node()) {
          sectionEl.classed('vzb-accordion-active', true);
        }
      })
    }
  },
  
  resize: function() {
    this._super();
    if(this.placeholderEl) {
      this._setMaxHeight();
    }
  },
  
  _setMaxHeight: function() {
    var totalHeight = this.root.element.offsetHeight;
    if(this.getLayoutProfile() !== 'small') {
      if(!this.topPos && (this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true"))) {
        var dialogBottom = parseInt(this.placeholderEl.style('bottom'), 10);
        totalHeight = totalHeight - dialogBottom;
      } else {
        var topPos = this.topPos ? parseInt(this.topPos, 10) : this.placeholderEl[0][0].offsetTop; 
        totalHeight = totalHeight - topPos;
      }
    } else {
      totalHeight = totalHeight - 50;
    }

    this.element.style('max-height', totalHeight + 'px');
  },
  
  _addDialogs: function(dialog_list) {
    this._components_config = [];
    var details_dlgs = [];
    if(!dialog_list.length) return;
    //add a component for each dialog
    for(var i = 0; i < dialog_list.length; i++) {

      //check moreoptions in dialog.moreoptions
      if(dialog_list[i] === "moreoptions") continue;
      
      var dlg = dialog_list[i];
      var dlg_config = utils.deepClone(this.parent._available_dialogs[dlg]);

      //if it's a dialog, add component
      if(dlg_config && dlg_config.dialog) {
        var comps = this._components_config;

        //add corresponding component
        comps.push({
          component: dlg_config.dialog,
          placeholder: '.vzb-dialogs-dialog[data-dlg="' + dlg + '"]',
          model: ["state", "ui", "language"]
        });

        dlg_config.component = comps.length - 1;
      
        dlg_config.id = dlg;
        details_dlgs.push(dlg_config);
      }
    };

    this.contentEl.selectAll('div').data(details_dlgs)
      .enter().append("div")
      .attr('class', function (d) {
        var cls = 'vzb-dialogs-dialog vzb-moreoptions vzb-accordion-section';
        return cls;
      })
      .attr('data-dlg', function(d) {
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
    });
  }
});

export default MoreOptions;
