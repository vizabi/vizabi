define([
    'underscore',
    'base/model',
    'managers/events'
], function(_, Model, Events) {


    var ToolModel = Model.extend({
        init: function(data) {
            this.state = new Model();
            this.data = new Model(data);
        },

        getState: function(attr) {
            return this.state.get(attr);
        },

        setState: function(attr, value, silent) {
            // TODO: Here we do validation

            this.state.set(attr, value, silent);
            if (!silent) Events.trigger("change:state", attr, value);
        },

        getData: function(attr) {
            return this.data.get(attr);
        },

        setData: function(attr, value, silent) {
            // TODO: Here we do validation

            this.data.set(attr, value, silent);
            if (!silent) Events.trigger("change:data", attr, value);
        }

    });

    return ToolModel;
});