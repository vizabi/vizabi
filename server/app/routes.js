var _ = require('lodash');
var cache = require('express-redis-cache')();
var mongoose = require('mongoose');
var compression = require('compression');

// register models
require('./models');

var Item = mongoose.model('Item');
var Menu = mongoose.model('Menu');
var RelatedItem = mongoose.model('RelatedItem');
var Indicators = mongoose.model('Indicators');

var ObjectId = mongoose.Types.ObjectId;




var BASEURL = '/tools/';

function getAll(res, model, populate) {
  var found = model.find().lean(true);
  if (populate) {
    found = found.populate(populate);
  }

  found.exec(function (err, items) {
    if (err) {
      return res.send(err);
    }

    return res.json(items);
  });
}

function getOne(res, model, conditions, populate) {
  var found = model.findOne(conditions);
  if (populate) found = found.populate(populate);
  found.exec(function (err, item) {
    if (err)
      res.send(err);
    res.json(item);
  });
}


function getRelatedItems(res) {
  getAll(res, RelatedItem, '_relatedTo');
};

function getRelatedItem(res, id) {
  getOne(res, RelatedItem, {"_id": ObjectId(id)}, '_relatedTo');
};

function getItems(res) {
  getAll(res, Item, 'relateditems');
};

function getItem(res, id) {
  getOne(res, Item, {"_id": ObjectId(id)}, 'relateditems');
};


function getMenu(which, res) {
  getOne(res, Menu, {
    "menu_label": which
  });
};


module.exports = function (app) {

  console.log(BASEURL + 'api/item');

  /* API Routes */

  //get all items in the database
  app.get(BASEURL + 'api/item', function (req, res) {
    getItems(res);
  });

  app.get(BASEURL + 'api/item/:item_id', function (req, res) {
    getItem(res, req.params.item_id);
  });

  //insert an item to the database
  app.post(BASEURL + 'api/item', function (req, res) {
    Item.create({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      tool: req.body.tool,
      opts: req.body.opts
    }, function (err, item) {
      if (err)
        res.send(err);
      // return all items
      getItems(res);
    });

  });

  // delete an item
  app.delete(BASEURL + 'api/item/:item_id', function (req, res) {
    Item.remove({
      _id: req.params.item_id
    }, function (err, item) {
      if (err)
        res.send(err);
      // return all items
      getItem(res, item._id);
    });
  });

  //get menu in the database
  app.get(BASEURL + 'api/menu', function (req, res) {
    getMenu("Home", res);
  });

  //get all related items in the database
  app.get(BASEURL + 'api/related', function (req, res) {
    getRelatedItems(res);
  });

  app.get(BASEURL + 'api/related/:related_id', function (req, res) {
    getRelatedItem(res, req.params.related_id);
  });

  //insert a related item to the database
  app.post(BASEURL + 'api/related', function (req, res) {

    var relatedTo = req.body._relatedTo.split(",").map(function (id) {
      return ObjectId(id);
    });

    RelatedItem.create({
      title: req.body.title,
      subtitle: req.body.subtitle,
      image: req.body.image,
      link: req.body.link,
      _relatedTo: relatedTo
    }, function (err, related_item) {
      if (err)
        res.send(err);

      var new_id = related_item._id;

      var items = related_item._relatedTo,
        s = items.length,
        i;

      for (i = 0; i < s; i++) {
        Item.findOne({"_id": ObjectId(items[i])}, function (err, item) {
          item.relateditems = item.relateditems.map(function (id) {
            return ObjectId(id);
          });
          item.relateditems.push(new_id);
          item.save();
        });
      }

      getRelatedItem(res, new_id);
    });

  });

  // indicators data source
  app.get(BASEURL + 'api/indicators/stub', compression(), cache.route({expire: 300}), function (req, res, next) {
    return Indicators.find().sort({time: 1}).lean().exec(function (err, indicatorValues) {
      if (err) {
        return res.send(err);
        // return next(err);
      }

      var headers = ['geo', 'geo.name', 'geo.cat', 'geo.region', 'time', 'pop', 'gdp_per_cap', 'u5mr'];
      var data = {
        headers: headers,
        rows: _.map(indicatorValues, function (indVal) {
          return [indVal.geo, indVal.name, indVal.cat, indVal.region, indVal.time, indVal.pop, indVal.gdp_per_cap, indVal.gini, indVal.u5mr];
        })
      };
      return res.json({success: true, data: data});
    });
  });

  /* APP Routes */
  app.get('*', function (req, res) {
    res.sendfile('./client/dist' + BASEURL + 'index.html'); // load the single view file
  });
};



