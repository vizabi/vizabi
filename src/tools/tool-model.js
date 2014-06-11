define([
	'base/model'
], function(Model) {


    var ToolModel = Model.extend({
        init: function(options) {
            this.state = new Model();
            this.data = new Model();
        },

        getState: function(attr) {
            return this.state.get(attr);
        },

        setState: function(attr, value) {
            // TODO: Here we do validation

            this.state.set(attr, value);
        },

        getData: function(attr) {
            return this.data.get(attr);
        },

        setData: function(attr, value) {
        	// TODO: Here we do validation
            
            this.data.set(attr, value);
        }    	

    });

    return ToolModel;
});