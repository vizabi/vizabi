var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.model('RelatedItem', {
  title : {type : String, default: ''},
  subtitle : {type : String, default: ''},
  image : {type : String, default: ''},
  link : {type : String, default: ''},
  _relatedTo: [{ type: Schema.Types.ObjectId, ref: 'Item' }]
});

mongoose.model('Item', {
	title : {type : String, default: ''},
	category : {type : String, default: ''},
	description : {type : String, default: ''},
  image : {type : String, default: ''},
	tool : {type : String, default: 'BubbleChart'},
	opts : {type : Object, default: {}},
  relateditems : [{ type: Schema.Types.ObjectId, ref: 'RelatedItem' }]
});
