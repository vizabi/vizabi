define([
    'underscore',
    'base/model',
    'base/events'
], function(_, Model, Events) {


    var ToolModel = Model.extend({
        init: function(data) {
            this.state = new Model();
            this.data = new Model();
            this.data.setSource(data);

            this.language = "en";
            this.ui_string = {};

            //call parent init since this is also a model
            this._super();
        },

        getState: function(attr) {
            return this.state.get(attr);
        },

        setState: function(attr, value, silent) {
            // TODO: Here we do validation
            this.state.set(attr, value, silent);
            if (!silent) Events.trigger("change:state", this.state.get());
        },

        getData: function(attr) {
            return this.data.get(attr);
        },

        setData: function(attr, value, silent) {
            // TODO: Here we do validation
            this.data.set(attr, value, silent);
            if (!silent) Events.trigger("change:data", this.data.get());
        }

    });

    return ToolModel;
});