//d3.svg.colorPicker


var instance = null;

export default function colorPicker() {


  return function getInstance() {
    if (instance == null) {
      instance = d3_color_picker();
    }
    return instance;
  }();

  function d3_color_picker() {
    // tuning defaults
    var nCellsH = 15;
    // number of cells by hues (angular)
    var minH = 0;
    // which hue do we start from: 0 to 1 instead of 0 to 365
    var nCellsL = 4;
    // number of cells by lightness (radial)
    var minL = .5;
    // which lightness to start from: 0 to 1. Recommended .3...0.5
    var satConstant = .7;
    // constant saturation for color wheel: 0 to 1. Recommended .7...0.8
    var outerL_display = .4;
    // ecxeptional saturation of the outer circle. the one displayed 0 to 1
    var outerL_meaning = .3;
    // ecxeptional saturation of the outer circle. the one actually ment 0 to 1
    var firstAngleSat = 0;
    // exceptional saturation at first angular segment. Set 0 to have shades of grey
    var minRadius = 15;
    //radius of the central hole in color wheel: px
    var maxWidth = 280;
    var maxHeight = 323;
    var margin = {
      top: .1,
      bottom: .1,
      left: .1,
      right: .1
    };
    //margins in % of container's width and height
    var colorOld = '#000';
    var colorDef = '#000';
    var colorWhite = '#f8f8f8';
    // names of CSS classes
    var css = {
      INVISIBLE: 'vzb-invisible',
      COLOR_POINTER: 'vzb-colorpicker-pointer',
      COLOR_BUTTON: 'vzb-colorpicker-cell',
      COLOR_DEFAULT: 'vzb-colorpicker-default',
      COLOR_SAMPLE: 'vzb-colorpicker-sample',
      COLOR_PICKER: 'vzb-colorpicker-svg',
      COLOR_CIRCLE: 'vzb-colorpicker-circle',
      COLOR_CIRCLES: 'vzb-colorpicker-circles',
      COLOR_SEGMENT: 'vzb-colorpicker-segment',
      COLOR_BACKGR: 'vzb-colorpicker-background'
    };
    var colorData = [];
    //here we store color data. formatted as follows:
    /*
     [
     [ // outer circle
     {display: "#123456", meaning: "#123456"}, // first angle
     ...
     {display: "#123456", meaning: "#123456"} // last angle, clockwise
     ],
     [ // next circle
     {display: "#123456", meaning: "#123456"}, // first angle
     ...
     {display: "#123456", meaning: "#123456"} // last angle, clockwise
     ],

     ...

     [ // inner circle
     {display: "#123456", meaning: "#123456"}, // first angle
     ...
     {display: "#123456", meaning: "#123456"} // last angle, clockwise
     ]
     ]
     */
    var arc = d3.svg.arc();
    var pie = d3.layout.pie().sort(null).value(function(d) {
      return 1;
    });
    var svg = null;
    var container = null;
    var colorPointer = null;
    var showColorPicker = false;
    var sampleRect = null;
    var sampleText = null;
    var background = null;
    var callback = function(value) {
      console.info('Color picker callback example. Setting color to ' + value);
    };

    function _generateColorData() {
      var result = [];
      // loop across circles
      for(var l = 0; l < nCellsL; l++) {
        var lightness = minL + (1 - minL) / nCellsL * l;
        // new circle of cells
        result.push([]);
        // loop across angles
        for(var h = 0; h <= nCellsH; h++) {
          var hue = minH + (1 - minH) / nCellsH * h;
          // new cell
          result[l].push({
            display: _hslToRgb(hue, h == 0 ? firstAngleSat : satConstant, l == 0 ? outerL_display : lightness),
            meaning: _hslToRgb(hue, h == 0 ? firstAngleSat : satConstant, l == 0 ? outerL_meaning : lightness)
          });
        }
      }
      return result;
    }

    function _hslToRgb(h, s, l) {
      var r, g, b;
      if(s == 0) {
        r = g = b = l; // achromatic
      } else {
        var _hue2rgb = function _hue2rgb(p, q, t) {
          if(t < 0)
            t += 1;
          if(t > 1)
            t -= 1;
          if(t < 1 / 6)
            return p + (q - p) * 6 * t;
          if(t < 1 / 2)
            return q;
          if(t < 2 / 3)
            return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        var q = l < .5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = _hue2rgb(p, q, h + 1 / 3);
        g = _hue2rgb(p, q, h);
        b = _hue2rgb(p, q, h - 1 / 3);
      }
      return '#' + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(
        16);
    }

    // this is init function. call it once after you are satisfied with parameters tuning
    // container should be a D3 selection that has a div where we want to render color picker
    // that div should have !=0 width and height in its style
    function colorPicker(container) {
      colorPicker.container = container;
      svg = container.select('.' + css.COLOR_PICKER);
      if(!svg.empty()) {
        return;
      }
      container.on('click', function() {
        colorPicker.show(false);
        d3.event.stopPropagation();
      });
      colorData = _generateColorData();

      svg = container.append('svg')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('max-width', maxWidth + "px")
        .style('height', '100%')
        .style('max-height', maxHeight + "px")
        .style('z-index', 9999)
        .attr('class', css.COLOR_PICKER + " vzb-dialog-shadow")
        .classed(css.INVISIBLE, !showColorPicker)
        .on('mouseout', function(d) { _cellHover(colorOld); });

      var width = parseInt(svg.style('width'));
      var height = parseInt(svg.style('height'));
      var maxRadius = width / 2 * (1 - margin.left - margin.right);
      background = svg.append('rect')
        .attr('width', width)
        .attr('height', maxHeight)
        .attr('class', css.COLOR_BUTTON +' '+ css.COLOR_BACKGR)
        .on('mouseover',
          function(d) {
            _cellHover(colorOld);
          });          
      var circles = svg.append('g')
        .attr('class', css.COLOR_CIRCLES)
        .attr('transform', 'translate(' + (maxRadius + width * margin.left) +
        ',' + (maxRadius + height * margin.top) + ')');

      svg.append('rect')
        .attr('class', css.COLOR_SAMPLE)
        .attr('width', width / 2)
        .attr('height', height * margin.top / 2);

      sampleRect = svg.append('rect')
        .attr('class', css.COLOR_SAMPLE)
        .attr('width', width / 2)
        .attr('x', width / 2)
        .attr('height', height * margin.top / 2);

      svg.append('text')
        .attr('x', width * margin.left)
        .attr('y', height * margin.top / 2)
        .attr('dy', '1.3em')
        .attr('class', css.COLOR_SAMPLE)
        .style('text-anchor', 'start');

      sampleText = svg.append('text').attr('x', width * (1 - margin.right))
        .attr('y', height * margin.top / 2)
        .attr('dy', '1.3em')
        .attr('class', css.COLOR_SAMPLE)
        .style('text-anchor', 'end');

      svg.append('text')
        .attr('x', width * .1)
        .attr('y', height * (1 - margin.bottom))
        .attr('dy', '1.2em')
        .attr('class', "vzb-default-label")
        .style('text-anchor', 'start')
        .text('default');

      svg.append('circle')
        .attr('class', css.COLOR_DEFAULT + ' ' + css.COLOR_BUTTON)
        .attr('r', width * margin.left / 2)
        .attr('cx', width * margin.left * 1.5)
        .attr('cy', height * (1 - margin.bottom * 1.5))
        .on('mouseover',
          function() {
            d3.select(this).style('stroke', '#444');
            _cellHover(colorDef);
        })
        .on('mouseout', function() {
          d3.select(this).style('stroke', 'none');
        });

      circles.selectAll('.' + css.COLOR_CIRCLE)
        .data(colorData).enter().append('g')
          .attr('class', css.COLOR_CIRCLE)
            .each(
              function(circleData, index) {
                arc.outerRadius(minRadius + (maxRadius - minRadius) / nCellsL *
                  (nCellsL - index)).innerRadius(minRadius +
                  (maxRadius - minRadius) / nCellsL * (nCellsL - index - 1));
                var segment = d3.select(this).selectAll('.' + css.COLOR_SEGMENT)
                  .data(pie(circleData)).enter().append('g')
                    .attr('class', css.COLOR_SEGMENT);

              segment.append('path')
                .attr('class', css.COLOR_BUTTON)
                .attr('d', arc)
                .style('fill', function(d) {
                  return d.data.display;
                })
                .style('stroke', function(d) {
                  return d.data.display;
                })
                .on('mouseover', function(d) {
                  _cellHover(d.data.meaning, this);
                })
                .on('mouseout', function(d) {
                  _cellUnHover();
                });
            });

      circles.append('circle')
        .attr('r', minRadius)
        .attr('fill', colorWhite)
        .attr('class', css.COLOR_BUTTON)
        .on('mouseover',
          function() {
            d3.select(this).style('stroke', "#555");
            _cellHover(colorWhite);
        })
        .on('mouseout', function() {
          d3.select(this).style('stroke', 'none');
        });        

      colorPointer = circles.append('path')
        .attr('class', css.COLOR_POINTER + ' ' + css.INVISIBLE);

      svg.selectAll('.' + css.COLOR_BUTTON)
        .on('click', function() {
          d3.event.stopPropagation();
          _this.show(false);
        });
      _doTheStyling(svg);
      colorPicker.resize(svg);
    }

    var _doTheStyling = function(svg) {
      //styling
      svg.select('.' + css.COLOR_BACKGR)
        .style('fill', 'white');

      svg.select('.' + css.COLOR_POINTER)
        .style('stroke-width', 2)
        .style('stroke', colorWhite)
        .style('pointer-events', 'none')
        .style('fill', 'none');

      svg.selectAll('.' + css.COLOR_BUTTON)
        .style('cursor', 'pointer');

      svg.selectAll('text')
        .style('fill', '#D9D9D9')
        .style('font-size', '0.7em')
        .style('text-transform', 'uppercase');

      svg.selectAll('circle.' + css.COLOR_BUTTON)
        .style('stroke-width', 2);
    };

    var _this = colorPicker;
    var _cellHover = function(value, view) {
      // show color pointer if the view is set (a cell of colorwheel)
      if(view != null)
        colorPointer.classed(css.INVISIBLE, false)
          .attr('d', d3.select(view)
          .attr('d'));

      sampleRect.style('fill', value);
      sampleText.text(value);
      callback(value);
    };
    var _cellUnHover = function() {
      colorPointer.classed(css.INVISIBLE, true);
    };
    //Use this function to hide or show the color picker
    //true = show, false = hide, "toggle" or TOGGLE = toggle
    var TOGGLE = 'toggle';
    colorPicker.show = function(arg) {
      if(!arguments.length)
        return showColorPicker;
      if(svg == null)
        console.warn('Color picker is missing SVG element. Was init sequence performed?');
      showColorPicker = arg == TOGGLE ? !showColorPicker : arg;
      if (!showColorPicker) {
        callback = function() {};
      }
      svg.classed(css.INVISIBLE, !showColorPicker);
    };
    // getters and setters
    colorPicker.nCellsH = function(arg) {
      if(!arguments.length)
        return nCellsH;
      nCellsH = arg;
      return colorPicker;
    };
    colorPicker.minH = function(arg) {
      if(!arguments.length)
        return minH;
      minH = arg;
      return colorPicker;
    };
    colorPicker.nCellsL = function(arg) {
      if(!arguments.length)
        return nCellsL;
      nCellsL = arg;
      return colorPicker;
    };
    colorPicker.minL = function(arg) {
      if(!arguments.length)
        return minL;
      minL = arg;
      return colorPicker;
    };
    colorPicker.outerL_display = function(arg) {
      if(!arguments.length)
        return outerL_display;
      outerL_display = arg;
      return colorPicker;
    };
    colorPicker.outerL_meaning = function(arg) {
      if(!arguments.length)
        return outerL_meaning;
      outerL_meaning = arg;
      return colorPicker;
    };
    colorPicker.satConstant = function(arg) {
      if(!arguments.length)
        return satConstant;
      satConstant = arg;
      return colorPicker;
    };
    colorPicker.firstAngleSat = function(arg) {
      if(!arguments.length)
        return firstAngleSat;
      firstAngleSat = arg;
      return colorPicker;
    };
    colorPicker.minRadius = function(arg) {
      if(!arguments.length)
        return minRadius;
      minRadius = arg;
      return colorPicker;
    };
    colorPicker.margin = function(arg) {
      if(!arguments.length)
        return margin;
      margin = arg;
      return colorPicker;
    };
    colorPicker.callback = function(arg) {
      if(!arguments.length)
        return callback;
      callback = arg;
      return colorPicker;
    };
    colorPicker.colorDef = function(arg) {
      if(!arguments.length)
        return colorDef;
      if (typeof arg !== 'undefined') {
        colorDef = arg;
      }
      if(svg == null)
        console.warn('Color picker is missing SVG element. Was init sequence performed?');
      svg.select('.' + css.COLOR_DEFAULT).style('fill', colorDef);
      return colorPicker;
    };
    colorPicker.translate = function(translator) {
      if(translator instanceof Function) {
        svg.select(".vzb-default-label")
          .text(translator("colorpicker/default"));
      }
      return colorPicker;
    };
    /**
     * @param {ClientRect} screen parent element
     * @param {int[]} arg [x,y] of color picker position
     */
    colorPicker.fitToScreen = function(arg) {
      var screen = colorPicker.container.node().getBoundingClientRect();
      var xPos, yPos;

      var width = parseInt(svg.style('width'));
      var height = parseInt(svg.style('height'));

      if (!arg) {
        xPos = screen.width - parseInt(svg.style('right')) - width;
        yPos = parseInt(svg.style('top'));
      } else {
        xPos = arg[0] - screen.left;
        yPos = arg[1] - screen.top;
      }

      var styles = {left: ''};
      if (screen.width * 0.8 <= width) {
        styles.right = (screen.width - width) * 0.5 + "px";
      } else if (xPos + width > screen.width) {
        styles.right = Math.min(screen.width * 0.1, 20) + "px";
      } else {
        styles.right = screen.width - xPos - width + "px";
      }
      if (screen.height * 0.8 <= height) {
        styles.top = (screen.height - height) * 0.5 + "px";
      } else if (yPos + height * 1.2 > screen.height) {
        styles.top = screen.height * 0.9 - height + "px";
      } else {
        styles.top = yPos + "px";
      }

      svg.style(styles);
      return colorPicker;
    };
    colorPicker.colorOld = function(arg) {
      if(!arguments.length)
        return colorOld;
      colorOld = arg;
      if(svg == null)
        console.warn('Color picker is missing SVG element. Was init sequence performed?');
      svg.select('rect.' + css.COLOR_SAMPLE).style('fill', colorOld);
      svg.select('text.' + css.COLOR_SAMPLE).text(colorOld);
      return colorPicker;
    };

    colorPicker.resize = function(arg) {

      if(!arguments.length)
        return resize;
      if (typeof arg !== 'undefined') {
        var svg = arg;
        var width = parseInt(svg.style('width'));
        var height = parseInt(svg.style('height'));
        var maxRadius = width / 2 * (1 - margin.left - margin.right);
        var selectedColor = svg.select('.'+css.COLOR_DEFAULT);
        var defaultLabel = svg.select('.vzb-default-label');
        var circles = svg.select('.' + css.COLOR_CIRCLES);
       
        var hPos = maxRadius + height * margin.top;
        var hPosCenter = (1 + margin.top * .5) * height * .5;
        hPos = hPos > hPosCenter ? hPosCenter : hPos; 
        circles.attr('transform', 'translate(' + (maxRadius + width * margin.left) +
        ',' + hPos + ')');
        selectedColor.attr('cx', width * margin.left * 1.5)
                     .attr('cy', height * (1 - margin.bottom * 1.5));
        defaultLabel.attr('x', width * .1)
                    .attr('y', height * (1 - margin.bottom));
      }
      colorPicker.fitToScreen();

      return colorPicker;
    };
    return colorPicker;
  };
};
