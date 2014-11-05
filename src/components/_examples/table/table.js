define([
    'jquery',
    'base/utils',
    'base/component',
], function($, utils, Component) {

    var container;

    var Table = Component.extend({

        /**
         * Initializes the barchart
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, context) {
            this.template = "components/_examples/table/table";
            this._super(config, context);
        },

        /**
         * Executes right after the template is in place
         */
        postRender: function() {
            //
        },

        /**
         * Updates the component as soon as the model/models change
         */
        update: function() {

            var indicator = this.model.show.indicator,
                data = this.model.data.getItems(),
                columns = ["geo.name", "time", indicator];

            var table = this.element;
            table.html("");


            var thead = table.append("thead"),
                tbody = table.append("tbody");

            // append the header row
            thead.append("tr")
                .selectAll("th")
                .data(columns)
                .enter()
                .append("th")
                .text(function(column) {
                    return column;
                });

            // create a row for each object in the data
            var rows = tbody.selectAll("tr")
                .data(data)
                .enter()
                .append("tr");

            // create a cell in each row for each column
            var cells = rows.selectAll("td")
                .data(function(row) {
                    return columns.map(function(column) {
                        return {
                            column: column,
                            value: row[column]
                        };
                    });
                })
                .enter()
                .append("td")
                .text(function(d) {
                    return d.value;
                });
        }

    });

    return Table;
});
