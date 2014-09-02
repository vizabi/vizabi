define([
    'underscore',
    'base/model',
    'base/events'
], function(_, Model, Events) {


    var ToolModel = Model.extend({
        init: function(data) {
            this.state = new Model();
            this.language = new Model();
            this.data = new Model();
            this.data.setSource(data);
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
        },

        getLanguage: function(attr) {
            return this.language.get(attr);
        },

        setLanguage: function(attr, value, silent) {
            // TODO: Here we do validation
            this.language.set(attr, value, silent);
            if (!silent) Events.trigger("change:language", this.language.get());
        },

    });

    return ToolModel;
});