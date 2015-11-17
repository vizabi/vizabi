import * as utils from 'base/utils';
import globals from 'base/globals';
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

        this.model_binds = {};
        this.model_binds["change:language:strings"] = function(evt) {
            _this.updateView();
        };
        this.model_binds["change:marker:" + this.markerID] = function(evt) {
            _this.updateView();
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
            _this.root.findChildByName("gapminder-treemenu")
                .markerID(_this.markerID)
                .alignX("left")
                .alignY("top")
                .updateView()
                .toggle();
        });
    },

    
    updateView: function() {
        var _this = this;
        this.translator = this.model.language.getTFunction();
        this.el_select.text(this.translator("indicator/" + this.model.marker[this.markerID].which));
    }
    
});

export default IndPicker;