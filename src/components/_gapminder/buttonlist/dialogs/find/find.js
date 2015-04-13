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
                "change:state:entities:select": function(evt) {
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
            this.input_search = this.element.select("#vzb-find-search");
            this.deselect_all = this.element.select("#vzb-find-deselect");

            var _this = this;
            this.input_search.on("input", function() {
                _this.showHideSearch();
            });

            this.deselect_all.on("click", function() {
                _this.deselectEntities();
            });

            this._super();
        },

        open: function() {
            this.input_search.node().value = "";
            this.showHideSearch();
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

            //sort data alphabetically
            data.sort(function(a, b) {
                return (a.name < b.name) ? -1 : 1;
            });

            this.list.html("");

            var items = this.list.selectAll(".vzb-find-item")
                .data(data)
                .enter()
                .append("div")
                .attr("class", "vzb-find-item vzb-dialog-checkbox")

            items.append("input")
                .attr("type", "checkbox")
                .attr("class", "vzb-find-item")
                .attr("id", function(d) {
                    return "-find-" + d.geo;
                })
                .property("checked", function(d) {
                    return (selected.indexOf(d.geo) !== -1);
                })
                .on("change", function(d) {
                    _this.model.state.entities.selectEntity(d);
                });

            items.append("label")
                .attr("for", function(d) {
                    return "-find-" + d.geo;
                })
                .text(function(d) {
                    return d.name;
                })
                .on("mouseover", function(d) {
                    _this.model.state.entities.highlightEntity(d);
                })
                .on("mouseout", function(d) {
                    _this.model.state.entities.clearHighlighted();
                });

            this.showHideSearch();
            this.showHideDeselect();
        },

        showHideSearch: function() {

            var search = this.input_search.node().value || "";
            search = search.toLowerCase();

            this.list.selectAll(".vzb-find-item")
                     .classed("vzb-hidden", function(d) {
                        var lower = d.name.toLowerCase();
                        return (lower.indexOf(search) === -1);
                     });
        },

        showHideDeselect: function() {
            var selected = this.model.state.entities.getSelected();
            this.deselect_all.classed('vzb-hidden', (selected.length < 1));
        },

        deselectEntities: function() {
            this.model.state.entities.clearSelected();
        }

    });

    return FindDialog;
});