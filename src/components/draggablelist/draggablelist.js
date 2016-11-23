import * as utils from 'base/utils';
import Component from 'base/component';

var DraggableList = Component.extend({

  init: function(config, context) {
    this.template = '<span class="vzb-dl-holder"><ul class="vzb-draggable list vzb-dialog-scrollable"></ul></span>';
    var _this = this;
    this.name = 'draggableList';

    this.dataArrFn = config.dataArrFn;
    this.lang = config.lang;

    this.model_expects = [{
      name: "group",
      type: "model"
    }, {
      name: "color",
      type: "color"
    }, {
      name: "locale",
      type: "locale"
    }, {
      name: "chart",
      type: "model"
    }];

    this.groupID = config.groupID;
    this.isEnabled = config.isEnabled;
    this.draggable = true;

    if(!config.groupID) utils.warn("draggablelist.js complains on 'groupID' property: " + config.groupID);

    this.model_binds = {
      "translate:locale": function(evt) {
        _this.updateView();
      },
      "change:group.which": function(evt) {
        _this.updateView();
      }
    };

    this.model_binds["change:group." + this.groupID] = function(evt) {
        _this.updateView();
    };
    this.model_binds["change:chart." + this.isEnabled] = function(evt) {
      _this.draggable = _this.model.chart[_this.isEnabled];
      _this.updateView();
    };


    this._super(config, context);

    this.updateData = utils.debounce(this.updateData, 1000);

    this.itemDragger = d3.behavior.drag()
      .on('dragstart', function(draggedData, i) {
        if(_this.dataUpdateFlag || !_this.draggable) return;
        d3.event.sourceEvent.stopPropagation();
        _this.parentBoundRect = _this.element.node().getBoundingClientRect();
        _this.element
          .selectAll('div')
          .each(function(d, i) {
            var boundRect = this.getBoundingClientRect();
            d._y = boundRect.top;
            d._top = 0;
            if(draggedData.data === d.data) {
              d._height = boundRect.height;
              _this.selectedNode = this;
            }
          })
        d3.select(_this.selectedNode)
          .classed('dragged', true)
      })

      .on('drag', function(draggedData, draggedIndex) {
        if(_this.dataUpdateFlag || !_this.draggable) return;
        draggedData._top += d3.event.dy;
        var newDraggedY = draggedData._y + draggedData._top;
        if(newDraggedY > _this.parentBoundRect.top
          && newDraggedY + draggedData._height < _this.parentBoundRect.top + _this.parentBoundRect.height)
        {
          _this.itemsEl
            .style('top', function(d, i) {
              var top = 0;

              if (i < draggedIndex && d._y + draggedData._height * .5 > newDraggedY) {
                top = draggedData._height;
              }
              else if(i > draggedIndex && d._y - draggedData._height * .5 < newDraggedY) {
                top = -draggedData._height;
              }

              if (i != draggedIndex) d._top = top;
              return d._top + "px";
           })
        }
      })

      .on('dragend', function(d, i) {
        if(_this.dataUpdateFlag || !_this.draggable) return;
        _this.getData();
      })

  },

  ready: function() {
    var _this = this;

    var labels = _this.model.color.getColorlegendMarker().label.getItems();
    this.dataArrFn(utils.keys(labels));

    this.updateView();

    this.itemsEl = this.element
      .selectAll('div')

    this.itemsEl
      .call(_this.itemDragger);

    var test = this.itemsEl.select('li')
      .on('mouseover', function() {
        d3.select(this).classed('hover', true);
      })
      .on('mouseout', function() {
        d3.select(this).classed('hover', false);
      })
      .on('touchstart', function() {
        d3.event.preventDefault();
      })

  },

  updateView: function() {
    var _this = this;

    this.items = this.element.selectAll('div').data(function() {
      return _this.dataArrFn().map( function(d) { return {data:d};})});
    var draggable = _this.draggable?true:null;
    this.items.enter()
      .append('div')
      .append('li');

    var labels = _this.model.color.getColorlegendMarker().label.getItems();
    this.items.select('li').classed('hover', false).each(function(val, index) {
        d3.select(this).attr('data', val['data']).text(labels[val['data']]);
      });
    this.items.exit().remove();
    this.element.selectAll('div')
      .style('top', '')
      .attr('draggable', draggable)
      .classed('dragged', false);
    this.dataUpdateFlag = false;

  },

  getData: function() {
    var dataArr = [];
    var data = this.element
      .selectAll('div').data();

    dataArr = data
      .sort(function(a, b) {
        return (a._y + a._top) - (b._y + b._top);
      })
      .map(function(d) {
        return d.data
      })
    if(utils.arrayEquals(this.dataArrFn(), dataArr)) {
      this.updateView();
    } else {
      this.dataUpdateFlag = true;
      this.updateData(dataArr);
    }
  },

  updateData: function(dataArr) {
    this.dataArrFn(dataArr);
  },

  readyOnce: function() {
    var _this = this;

    this.element = d3.select(this.element).select('.list');

  }

});

export default DraggableList;
