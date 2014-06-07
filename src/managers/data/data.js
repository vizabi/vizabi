define([
	'base/class',
	'jquery',
	'underscore'
], function(Class, $, _) {
	var dataManager = Class.extend({
		init: function() {
			this.cache = {};
		},

		load: function(path, callback) {
			return $.getJSON(path, function(res) {
				if (typeof callback === 'function') {
					callback(res);
				}
				return res;
			});
		},

		loadWaffle: function(wafflePath, callback) {
			if (!this.cache.waffle) this.cache.waffle = {};
			var waffle = this.cache.waffle;
			return $.getJSON(wafflePath, function(res) {
				$.extend(true, waffle, res);
				if (typeof callback === 'function') {
					callback(res);
				}
			});
		},

		loadStats: function(statsPath, indicator, callback) {
			if (!this.cache.stats) this.cache.stats = {};
			if (!this.cache.stats[indicator]) this.cache.stats[indicator] = {};
			var cache = this.cache;
			return $.getJSON(statsPath, function(res) {
				$.extend(true, cache.stats[indicator], res);
				if (typeof callback === 'function') {
					callback(res);
				}
			});
		},

		getCache: function() {
			return this.cache;
		},

		getThing: function(filter) {
			if (!this.cache.waffle || !this.cache.waffle.definitions) return;

			var res = {},
				categories = this.cache.waffle.definitions.categories;

			if (!filter) {
				// returns all things from all categories
				for (var category in categories) {
					_.extend(res, categories[category].things);
				}
			} else {
				if (!_.isArray(filter)) {
					if (filter.id) {
						res[filter.id] = categories[filter.category].things[filter.id];
					} else {
						res = categories[filter.category].things;
					}
				} else {
					_.each(filter, function(d) {
						_.extend(res, this.getThing(d));
					}.bind(this))
				}
			}

			return res;
		},

		getStats: function(filter, indicator) {
			if (!indicator) return this.cache.stats;
			if (!filter) return this.cache.stats[indicator];

			var res = [];

			_.each(filter, function(f) {
				var temp = _.extend({}, f);
				temp.stats = this.cache.stats[indicator][f.id];
				res.push(temp);
			}, this);

			return res;
		},

		getWaffle: function() {
			return this.cache.waffle;
		}
	});

	return dataManager;
});
