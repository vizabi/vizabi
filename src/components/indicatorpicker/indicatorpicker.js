import * as utils from 'base/utils';
import Component from 'base/component';

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

var IndPicker = Component.extend({

    /**
     * Initializes the Indicator Picker.
     * Executed once before any template is rendered.
     * @param config The options passed to the component
     * @param context The component's parent
     */
    init: function(config, context) {

        this.name = 'gapminder-indicatorpicker';
        this.template = '<span class="vzb-ip-select"></span>';

        var _this = this;

        this.model_expects = [{
            name: "marker",
            type: "model"
        }, {
            name: "language",
            type: "language"
        }];

        this.markerID = config.markerID;
        if(!config.markerID) utils.warn("indicatorpicker.js complains on 'markerID' property: " + config.markerID);

        this.model_binds = {
            "change:language.strings": function(evt) {
                _this.updateView();
            },
            "change:marker": function(evt) {
                _this.updateView();
            },
            "ready": function(evt) {
                _this.updateView();
            }
        };


        //contructor is the same as any component
        this._super(config, context);
    },

    ready: function() {
        this.updateView();
    },


    readyOnce: function() {
        var _this = this;

        this.el_select = d3.select(this.element);

        this.el_select.on("click", function() {
            var rect = _this.el_select.node().getBoundingClientRect();
            var rootRect = _this.root.element.getBoundingClientRect();
            var treemenuComp = _this.root.findChildByName("gapminder-treemenu");
            var treemenuColWidth = treemenuComp.activeProfile.col_width; 
            var treemenuPaddLeft = parseInt(treemenuComp.wrapper.style('padding-left'), 10) || 0; 
            var treemenuPaddRight = parseInt(treemenuComp.wrapper.style('padding-right'), 10) || 0; 
            var topPos = rect.bottom - rootRect.top;
            var leftPos = rect.left - rootRect.left - (treemenuPaddLeft + treemenuPaddRight + treemenuColWidth - rect.width) * .5;
            
            treemenuComp
                .markerID(_this.markerID)
                .alignX("left")
                .alignY("top")
                .top(topPos)
                .left(leftPos)
                .updateView()
                .toggle();
        });
    },

    
    updateView: function() {
        if(!this._readyOnce) return;

        var _this = this;
        this.translator = this.model.language.getTFunction();
        
        var which = this.model.marker[this.markerID].which;
        var type = this.model.marker[this.markerID]._type;
        
        //Let the indicator "_default" in tree menu be translated differnetly for every hook type
        this.el_select.text(this.translator("indicator" + (which==="_default" ? "/" + type : "") + "/" + which));
    }
    
});

export default IndPicker;