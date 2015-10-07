(function () {
  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  if (!Vizabi._require('d3')) {
    return;
  }

  Vizabi.Component.extend('gapminder-draggablelist', {

    init: function (config, context) {
      this.template = '<span class="vzb-dl-holder"><ul class="vzb-draggable list"></ul></span>';
      var _this = this;

      this.dataArrFn = config.dataArrFn;
      this.lang = config.lang;

      this.model_expects = [
        {
          name: "language",
          type: "language"
        }
      ];

      this.model_binds = {
        "change:axis": function (evt) {
          _this.updateView();
        },
        "change:language": function (evt) {
          _this.updateView();
        }
      };

      this._super(config, context);

      this.updateData = utils.debounce(this.updateData, 1000);
    },

    ready: function() {
      var _this = this;

      this.updateView();

      this.element
        .selectAll('div')
        .on('dragstart', function () {
          d3.select(this).style('opacity', 0.4);

          _this.dragElem = this;
          d3.event.dataTransfer.setData('text/html', this.innerHTML);
          d3.event.dataTransfer.effectAllowed = 'move';
        })
        .on('dragover', function () {
          if (d3.event.preventDefault)
            d3.event.preventDefault();

          d3.event.dataTransfer.dropEffect = 'move';

          return false;
        })
        .on('dragenter', function () {
          d3.select(this).select('li').classed('over', true);

          return false;
        })
        .on('dragleave', function () {
          d3.select(this).select('li').classed('over', false);
        })
        .on('drop', function () {
          if (d3.event.stopPropagation)
            d3.event.stopPropagation();

          if (_this.dragElem) {
            _this.dragElem.innerHTML = this.innerHTML;
            this.innerHTML = d3.event.dataTransfer.getData('text/html');
          }

          return false;
        })
        .on('dragend', function () {
          d3.select(this).style('opacity', '');
          _this.element
            .selectAll('li')
            .classed('over', false);
          _this.updateData();
        })
    },

    updateView: function () {
      var _this = this;
      this.translator = this.model.language.getTFunction();
      this.element.selectAll('li').remove();

      this.data = this.element.selectAll('li').data(this.dataArrFn());
      this.data.enter()
        .insert('div')
        .attr('draggable', true)
        .insert('li')
        .each(function (val, index) {
          d3.select(this).attr('data', val).text(_this.translator(_this.lang + val));
        });
    },

    updateData: function () {
      var dataArr = [];
      this.element
        .selectAll('li')
        .each(function () {
          dataArr.push(d3.select(this).attr('data'));
        });
      this.dataArrFn(dataArr);
    },

    readyOnce: function() {
      var _this = this;

      this.element = d3.select(this.element).select('.list');
    }


  });
}).call(this);
