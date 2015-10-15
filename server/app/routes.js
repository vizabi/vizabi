var _ = require('lodash');
var path = require('path');
var cache = require('express-redis-cache')({
  client: require('../config/redis-client')
});
var express = require('express');
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

  return found.exec(function (err, items) {
    if (err) {
      return res.send(err);
    }

    return res.json(items);
  });
}

function getOne(res, model, conditions, populate) {
  var found = model.findOne(conditions).lean(true);
  if (populate) {
    found = found.populate(populate);
  }

  return found.exec(function (err, item) {
    if (err) {
      return res.send(err);
    }
    return res.json(item);
  });
}


function getRelatedItems(res) {
  return getAll(res, RelatedItem, '_relatedTo');
}

function getRelatedItem(res, id) {
  return getOne(res, RelatedItem, {"_id": ObjectId(id)}, '_relatedTo');
}

function getItems(res) {
  return getAll(res, Item, 'relateditems');
}

function getItem(res, id) {
  return getOne(res, Item, {"_id": ObjectId(id)}, 'relateditems');
}

function getMenu(which, res) {
  return getOne(res, Menu, {
    "menu_label": which
  });
}


module.exports = function (app) {
  var router = express.Router();
  /* API Routes */

  //get all items in the database
  router.get('/item', compression(), function (req, res) {
    return getItems(res);
  });

  router.get('/item/:item_id', function (req, res) {
    return getItem(res, req.params.item_id);
  });

  //insert an item to the database
  router.post('/item', function (req, res) {
    Item.create({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      tool: req.body.tool,
      opts: req.body.opts
    }, function (err, item) {
      if (err) {
        return res.send(err);
      }

      // return all items
      return getItems(res);
    });
  });

  // delete an item
  router.delete('/item/:item_id', function (req, res) {
    Item.remove({
      _id: req.params.item_id
    }, function (err, item) {
      if (err) {
        return res.send(err);
      }
      // return all items
      return getItem(res, item._id);
    });
  });

  //get menu in the database
  router.get('/menu', compression(), function (req, res) {
    return getMenu("Home", res);
  });

  //get all related items in the database
  router.get('/related', compression(), function (req, res) {
    return getRelatedItems(res);
  });

  router.get('/related/:related_id', function (req, res) {
    return getRelatedItem(res, req.params.related_id);
  });

  //insert a related item to the database
  app.post('/related', function (req, res) {

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
      if (err) {
        return res.send(err);
      }

      var new_id = related_item._id;
      var items = related_item._relatedTo;
      var s = items.length;
      for (var i = 0; i < s; i++) {
        Item.findOne({"_id": ObjectId(items[i])}, function (err, item) {
          item.relateditems = item.relateditems.map(function (id) {
            return ObjectId(id);
          });
          item.relateditems.push(new_id);
          item.save();
        });
      }

      return getRelatedItem(res, new_id);
    });
  });

  // indicators data source
  router.get('/indicators/stub', compression(), cache.route({expire: 300}), function (req, res, next) {
    var query = {};
    if (req.query.time) {
      var time = parseInt(req.query.time, 10);
      if (time) {
        query.time = time;
      } else {
        time =  JSON.parse(req.query.time);
        query.time = {$gte: time.from, $lte: time.to};
      }
    }
    return Indicators.find(query).sort({time: 1}).lean().exec(function (err, indicatorValues) {
      if (err) {
        return res.send(err);
        // return next(err);
      }

      var headers = ['geo', 'geo.name', 'geo.cat', 'geo.region', 'time', 'pop', 'gdp_per_cap', 'gini', 'u5mr'];
      var data = {
        headers: headers,
        rows: _.map(indicatorValues, function (indVal) {
          return [indVal.geo, indVal.name, indVal.cat, indVal.region, indVal.time, indVal.pop, indVal.gdp_per_cap, indVal.gini, indVal.u5mr];
        })
      };
      return res.json({success: true, data: data});
    });
  });

  var base = path.join(BASEURL, 'api');
  app.use(base, router);

  // one day
  app.use('/api/static/local_data', compression(), cache.route({expire: 86400}), express.static(path.join(__dirname, '/fixtures')));

  app.use('/api/static/data', compression(), cache.route({expire: 86400}), express.static(path.join(__dirname, '/fixtures')));
  /* APP Routes */
  app.get('/', function (req, res) {
    return res.sendfile('./client/dist' + BASEURL + 'redirect.html');
  });

  app.get('*', function (req, res) {
    return res.sendfile('./client/dist' + BASEURL + 'index.html');
    // load the single view file
  });
};



