var Item = require('./models/item');

function getItems(res) {
  Item.find(function(err, items) {
    if (err)
      res.send(err)
    res.json(items); // return all todos in JSON format
  });
};


module.exports = function(app) {

  /* API Routes */

  //get all items in the database
  app.get('/api/item', function(req, res) {
      getItems(res);
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
      getItems(res);
    });
  });

  /* APP Routes */
  app.get('*', function(req, res) {
  	res.sendfile('./client/dist/index.html'); // load the single view file
  });
};