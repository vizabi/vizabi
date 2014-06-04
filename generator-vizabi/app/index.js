'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');

var scssImporter = {
  tool: "// <?== generator.tool.style ==?>",
  widget: "// <?== generator.widget.style ==?>"
};

var paths = {
  widgets: 'src/widgets/',
  tools: 'src/tools/',
  style: 'src/style/'
}

var VizabiGenerator = yeoman.generators.Base.extend({
  init: function () {
  },

  askFor: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Welcome to the marvelous Vizabi generator!'));

    var vizabiPrompt = [{
      name: 'vizabiName',
      message: 'Name your new tool:'
    }];

    var widgetPrompt = [{
      name: 'widgetName',
      message: 'Name your new widget:'
    }];

    var prompts = [{
      type: 'list',
      name: 'generateWhat',
      message: 'What do you want to create?',
      choices: [
        { name: 'A new Vizabi tool', value: 'vizabi' },
        { name: 'A new Vizabi widget', value: 'widget' }
      ]
    }];

    this.prompt(prompts, function (props) {
      var that = this;
      this.generateWhat = props.generateWhat;

      if (this.generateWhat === 'vizabi') {
        this.prompt(vizabiPrompt, function (props2) {
          this.vizabiName = props2.vizabiName;
          done();
        }.bind(this));
      } else if (this.generateWhat === 'widget') {
        this.prompt(widgetPrompt, function (props2) {
          this.widgetName = props2.widgetName;
          done();
        }.bind(this));
      }
    }.bind(this));
  },

  app: function () {
    if (this.vizabiName) {
      var name = this._.slugify(this.vizabiName);
      var vizabiPath = name + '/' + name;
      var vizabiCssPath = name + '/_' + name;
      
      var mainStylePath = paths.style + 'vizabi.scss';
      var mainStyle = this.readFileAsString(mainStylePath);

      this.mkdir(paths.tools + name);
      this.template('_tool_plain.js', paths.tools + vizabiPath + '.js');
      this.template('_tool_plain.scss', paths.tools + vizabiCssPath + '.scss');
      
      if (mainStyle) {
        this.write(mainStylePath, 
          mainStyle.replace(scssImporter.tool,
            scssImporter.tool + '\n' + '@import \'' + name + '/' + '_' + name + '\';\n    '));
      }
    } else if (this.widgetName) {
      var name = this._.slugify(this.widgetName);
      var widgetPath = name + '/' + name;
      var widgetCssPath = name + '/_' + name;

      var mainStylePath = paths.style + 'vizabi.scss';
      var mainStyle = this.readFileAsString(mainStylePath);

      this.mkdir(paths.widgets + name);
      this.template('_widget_plain.js', paths.widgets + widgetPath + '.js');
      this.template('_widget_plain.scss', paths.widgets + widgetCssPath + '.scss');

      if (mainStyle) {
        this.write(mainStylePath, 
          mainStyle.replace(scssImporter.widget,
            scssImporter.tool + '\n' + '@import \'' + name + '/' + '_' + name + '\';\n    '));
      }
    }
  },

  projectfiles: function () {
  }
});

module.exports = VizabiGenerator;
