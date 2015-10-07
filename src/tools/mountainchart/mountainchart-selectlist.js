(function () {

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    Vizabi.Helper.extend("gapminder-mountainchart-selectlist", {

        init: function (context) {
            this.context = context;
            
        },
                
        rebuild: function (data) {
            var _this = this.context;
            
            var listData = _this.mountainPointers
                .concat(_this.groupedPointers)
                .concat(_this.stackedPointers)
                .filter(function (f) {
                    return _this.model.entities.isSelected(f);
                })
                .sort(function (a, b) {
                    if (b.yMax && a.yMax) return b.yMax - a.yMax;
                    return b.sortValue[0] - a.sortValue[0];
                });

            _this.selectList = _this.mountainLabelContainer.selectAll("g")
                .data(utils.unique(listData, function (d) { return d.KEY() }));

            _this.selectList.exit().remove();
            _this.selectList.enter().append("g")
                .attr("class", "vzb-mc-label")
                .each(function (d, i) {
                    d3.select(this).append("circle");
                    d3.select(this).append("text").attr("class", "vzb-mc-label-shadow");
                    d3.select(this).append("text");
                })
                .on("mousemove", function (d, i) {
                    _this.model.entities.highlightEntity(d);
                })
                .on("mouseout", function (d, i) {
                    _this.model.entities.clearHighlighted();
                })
                .on("click", function (d, i) {
                    _this.model.entities.clearHighlighted();
                    _this.model.entities.selectEntity(d);
                });
        },
        
        redraw: function () {
            var _this = this.context;
            if (!_this.selectList || !_this.someSelected) return;

            var sample = _this.mountainLabelContainer.append("g").attr("class", "vzb-mc-label").append("text").text("0");
            var fontHeight = sample[0][0].getBBox().height;
            d3.select(sample[0][0].parentNode).remove();
            var formatter = _this.model.marker.axis_y.tickFormatter;

            var titleHeight = _this.yTitleEl.select("text").node().getBBox().height || 0;

            var maxFontHeight = (_this.height - titleHeight * 3) / (_this.selectList.data().length + 2);
            if (fontHeight > maxFontHeight) fontHeight = maxFontHeight;

            _this.selectList
                .attr("transform", function (d, i) {
                    return "translate(0," + (fontHeight * i + titleHeight * 3) + ")";
                })
                .each(function (d, i) {

                    var view = d3.select(this);
                    var name = d.key ? _this.translator("region/" + d.key) : _this.values.label[d.KEY()];
                    var number = _this.values.axis_y[d.KEY()];

                    var string = name + ": " + formatter(number) + (i === 0 ? " people" : "");

                    view.select("circle")
                        .attr("r", fontHeight / 3)
                        .attr("cx", fontHeight * 0.4)
                        .attr("cy", fontHeight / 1.5)
                        .style("fill", _this.cScale(_this.values.color[d.KEY()]));


                    view.selectAll("text")
                        .attr("x", fontHeight)
                        .attr("y", fontHeight)
                        .text(string)
                        .style("font-size", fontHeight === maxFontHeight ? fontHeight : null);
                });
        },



    });


}).call(this);