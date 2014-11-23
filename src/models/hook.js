define([
    'lodash',
    'base/model'
], function(_, Model) {

    var Hook = Model.extend({

        /**
         * Initializes the hook
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {

            this.is_hook = true;    //we can check if this is a hook
            this._datahook = null;  //will hold reference to dataset

            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            this._super(values, intervals, bind);
        },

        /**
         * sets the dataset to be hooked to this
         * @params {Object} dataset reference to dataset
         */
        setDataHook: function(dataset) {
            return this._datahook;
        },

        /**
         * gets the dataset hooked to this
         * @returns {Object} reference to hooked dataset
         */
        getDataHook: function() {
            return this._datahook;
        }

    });

    return Hook;
});