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

            var _this = this;
            this.model_binds = {
                "change": function(evt) {
                    _this.update();
                },
                "ready": function(evt) {
                    _this.update();
                }
            }

            this._super(config, parent);
        },

        /**
         * Grab the list div
         */
        domReady: function() {
            this.list = this.element.select(".vzb-find-list");
            this._super();
        },

        open: function() {
            //this.list.html("Loading..." + _.uniqueId());
        },

        /**
         * Build the list everytime it updates
         */
        //TODO: split update in render and update methods
        update: function() {
            var _this = this;
            var selected = this.model.state.entities.getSelected();
            var labelModel = this.model.state.marker.label;
            var data = labelModel.getItems().map(function(d) {
                return {
                    geo: d["geo"],
                    name: labelModel.getValue(d)
                };
            });

            this.list.html("");

            var items = this.list.selectAll(".vzb-find-item")
                .data(data)
                .enter()
                .append("div")
                .attr("class", "vzb-find-item")
                .append("label");

            items.append("input")
                .attr("type", "checkbox")
                .attr("class", "vzb-find-item")
                .property("checked", function(d) {
                    return (selected.indexOf(d.geo) !== -1);
                })
                .on("change", function(d) {
                    _this.model.state.entities.selectEntity(d);
                });

            items.append("span")
                .text(function(d) {
                    return d.name
                });
        }

    });

    return FindDialog;
});