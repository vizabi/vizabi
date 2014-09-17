define([
    'jquery',
    'base/utils',
    'base/component',
], function($, utils, Component) {

    var container;

    var Table = Component.extend({
        init: function(parent, options) {
            this.template = "components/table/table";
            this._super(parent, options);
        },

        postRender: function() {
            this.update();
        },

        update: function() {
            var _this = this;

            //TODO: mapping of columns and data
            var columns = this.model.getState().columns,
                data = this.model.getData()[0][0],
                countries = this.model.getState("show")["geo"],
                minYear = this.model.getState("timeRange")[0].split("-")[0],
                maxYear = this.model.getState("timeRange")[0].split("-")[1],
                data_curr_range = data.filter(function(row) {
                    return (countries.indexOf(row["geo"]) >= 0) && (row.time >= minYear && row.time <= maxYear);
                });

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
                .data(data_curr_range)
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