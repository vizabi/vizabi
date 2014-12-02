define([
    'lodash',
    'components/_gapminder/buttonlist/dialogs/dialog'
], function(_, Dialog) {

    var FindDialog = Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'find';

            this._super(config, parent);
        },

        /**
         * Grab the list div
         */
        domReady: function() {
            this.list = this.element.select(".vzb-find-list");
            this._super();
        },

        /**
         * Build the list everytime it updates
         */
        modelReady: function() {
            var _this = this;
            listed = this.model.state.show.geo,
                data = this.model.data.getItems()[1].map(function(d) {
                    return {
                        geo: d["geo"],
                        name: d["geo.name"]
                    }
                });

            this.list.html("");

            var items = this.list.selectAll(".vzb-find-item")
                .data(data)
                .enter()
                .append("div")
                .attr("class", "vzb-find-item");

            items.append("input")
                .attr("type", "checkbox")
                .attr("class", "vzb-find-item")
                .property("checked", function(d) {
                    return (listed.indexOf(d.geo) !== -1);
                })
                .on("change", function(d) {
                    var checked = d3.select(this).property("checked");
                    _this.updateGeos(d.geo, checked);
                });

            items.append("span")
                .text(function(d) {
                    return d.name
                });
        },

        /**
         * Changes the geos in the state
         * @param {String} geo Identifier of geo
         * @param {Boolean} include Whether to include the geo or remove
         */
        updateGeos: function(geo, include) {
            var geos = this.model.state.show.geo;
            if (include) {
                geos.push(geo);
            } else {
                geos = _.without(geos, geo);
            }
            this.model.state.show.geo = geos;
        }

    });

    return FindDialog;
});