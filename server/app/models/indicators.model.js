var mongoose = require('mongoose');

mongoose.model('Indicators', {
  "geo": String,
  // geo.name
  "name": String,
  // geo.cat
  "cat": String,
  // geo.region
  "region": String,
  // time
  "time": {type: Number, index: true},
  "pop": Number,
  "gdp_per_cap": Number,
  "gini": Number,
  "u5mr": Number
});
