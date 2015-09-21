var Item = require('./models/item');
var Menu = require('./models/menu');

function getAll(model, res) {
    model.find(function(err, items) {
        if (err)
            res.send(err);
        res.json(items);
    });
}

function getOne(model, conditions, res) {
    model.findOne(conditions, function(err, item) {
        if (err)
            res.send(err);
        res.json(item);
    });
}


function getItems(res) {
    Item.find()
        .populate('relateditems')
        .exec(function(err, items) {
            if (err)
                res.send(err);
            res.json(items);
        }));
};


function getMenu(which, res) {
    getOne(Menu, {
        "menu_label": which
    }, res);
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

    //get menu in the database
    app.get('/api/menu', function(req, res) {
        getMenu("Home", res);
    });

    /* APP Routes */
    app.get('*', function(req, res) {
        res.sendfile('./client/dist/index.html'); // load the single view file
    });
};