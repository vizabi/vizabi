//Indicator Display
define([
    'd3',
    'lodash',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    var IndicatorDisplay = Component.extend({

        /*
         * INIT:
         * Executed once, before template loading
         */
        init: function(options, context) {
            this.name = "indicator-display";
            this.template = "components/_examples/indicator-display/indicator-display";

            //define expected models for this component
            this.model_expects = [{
                name: "rows",
                type: "model"
            }, {
                name: "time",
                type: "time"
            }];

            var _this = this;
            this.model_binds = {
                'ready': function() {
                    _this.update();
                },
                'change': function() {
                    _this.update();
                }
            };

            this._super(options, context);
        },

        /*
         * domReady:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        domReady: function() {
            // this.model.time.on("set", function(evt) {
            //     console.log("set!!!", evt);
            // })
            // this.model.rows.on("change", function(evt) {
            //     console.log("changed!!!", evt);
            // });
            // this.model.rows.on("load_start", function(evt) {
            //     console.log("LOADSTRAT!!!", evt);
            // })
        },


        /*
         * modelReady:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        update: function() {

            var time = this.model.time.value,
                countriesCurr = this.model.rows.label.getItems({ time: time });


            this.element.selectAll("p").remove();

            this.element.selectAll("p")
                .data(countriesCurr)
                .enter()
                .append("p");

            this.resize();

        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            var indicator = this.model.rows.number.value,
                _this = this;

            //todo: hooks can't be hacked like this
            this.element.selectAll("p")
                .text(function(d) {

                    var label = _this.model.rows.label.getValue(d),
                        number = _this.model.rows.number.getValue(d);

                    //adding a second label
                    if(_this.model.rows.label2) {
                        label += " (" + _this.model.rows.label2.getValue(d) + ")";
                    }

                    var string = label + ": ";

                    if (_this.getLayoutProfile() === 'small' && indicator === 'pop') {
                        string += Math.round(number / 100000) / 10 + " M";
                    } else if (indicator === 'pop') {
                        string += Math.round(number).toLocaleString();
                    } else {
                        string += number.toLocaleString();
                    }

                    return string;
                })
                .style("color", function(d) {
                    return _this.model.rows.color.getValue(d);
                });
        },


    });

    return IndicatorDisplay;

});