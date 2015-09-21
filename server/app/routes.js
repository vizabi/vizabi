var mongoose = require('mongoose');
var Item = require('./models/item');
var Menu = require('./models/menu');
var RelatedItem = mongoose.model('RelatedItem'); 
var ObjectId = mongoose.Types.ObjectId;

function getAll(res, model, populate) {
    var found = model.find();
    if(populate) found = found.populate(populate);
    found.exec(function(err, items) {
        if (err)
            res.send(err);
        res.json(items);
    });
}

function getOne(res, model, conditions, populate) {
    var found = model.findOne(conditions);
    if(populate) found = found.populate(populate);
    found.exec(function(err, item) {
        if (err)
            res.send(err);
        res.json(item);
    });
}


function getRelatedItems(res) {
    getAll(res, RelatedItem, '_relatedTo');
};

function getRelatedItem(res, id) {
  getOne(res, RelatedItem, { "_id": ObjectId(id) }, '_relatedTo');
};

function getItems(res) {
    getAll(res, Item, 'relateditems');
};

function getItem(res, id) {
  getOne(res, Item, { "_id": ObjectId(id) }, 'relateditems');
};


function getMenu(which, res) {
    getOne(res, Menu, {
        "menu_label": which
    });
};


module.exports = function(app) {

    /* API Routes */

    //get all items in the database
    app.get('/api/item', function(req, res) {
        getItems(res);
    });

    app.get('/api/item/:item_id', function(req, res) {
        getItem(res, req.params.item_id);
    });

    //insert an item to the database
    app.post('/api/item', function(req, res) {
        Item.create({
            title: req.body.title,
            category: req.body.category,
            description: req.body.description,
            tool: req.body.tool,
            opts: req.body.opts
        }, function(err, item) {
            if (err)
                res.send(err);
            // return all items
            getItems(res);
        });

    });

    // delete an item
    app.delete('/api/item/:item_id', function(req, res) {
        Item.remove({
            _id: req.params.item_id
        }, function(err, item) {
            if (err)
                res.send(err);
            // return all items
            getItem(res, item._id);
        });
    });

    //get menu in the database
    app.get('/api/menu', function(req, res) {
        getMenu("Home", res);
    });

    //get all related items in the database
    app.get('/api/related', function(req, res) {
        getRelatedItems(res);
    });

    app.get('/api/related/:related_id', function(req, res) {
        getRelatedItem(res, req.params.related_id);
    });

    //insert a related item to the database
    app.post('/api/related', function(req, res) {

        var relatedTo = req.body._relatedTo.split(",").map(function(id) {
          return ObjectId(id);
        });

        RelatedItem.create({
            title : req.body.title,
            subtitle : req.body.subtitle,
            image : req.body.image,
            link : req.body.link,
            _relatedTo: relatedTo
        }, function(err, related_item) {
            if (err)
                res.send(err);

            var new_id = related_item._id;

            var items = related_item._relatedTo,
                s = items.length,
                i;

            for(i=0;i<s;i++) {
              Item.findOne({ "_id": ObjectId(items[i]) }, function (err, item){
                    item.relateditems = item.relateditems.map(function(id) { return ObjectId(id); });
                    item.relateditems.push(new_id);
                    item.save();
                  });
            }

            getRelatedItem(res, new_id);
        });

    });

    /* APP Routes */
    app.get('*', function(req, res) {
        res.sendfile('./client/dist/index.html'); // load the single view file
    });
};