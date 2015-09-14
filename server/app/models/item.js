var mongoose = require('mongoose');

module.exports = mongoose.model('Item', {
	title : {type : String, default: ''},
	category : {type : String, default: ''},
	description : {type : String, default: ''},
	tool : {type : String, default: 'BubbleChart'},
	opts : {type : Object, default: {}}
});