'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');

var protectedStrings = {
  scss: "// <?== generator.vizabi.style ==?>"
};

var VizabiGenerator = yeoman.generators.Base.extend({
  init: function () {
  },

  askFor: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Welcome to the marvelous Vizabi generator!'));

    var vizabiPrompt = [{
      name: 'vizabiName',
      message: 'Name your new visualization:'
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
        { name: 'A new Vizabi visualization', value: 'vizabi' },
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
      
      var mainStylePath = 'visualizations/vizabi.scss';
      var mainStyle = this.readFileAsString(mainStylePath);

      this.mkdir('visualizations/' + name);
      this.template('_vizabi_plain.js', 'visualizations/' + vizabiPath + '.js');
      this.template('_vizabi_plain.scss', 'visualizations/' + vizabiCssPath + '.scss');
      
      if (mainStyle) {
        this.write(mainStylePath, 
          mainStyle.replace(protectedStrings.scss,
            '@import \'' + name + '/' + '_' + name + '\';\n    ' + protectedStrings.scss));
      }
    } else if (this.widgetName) {
      var name = this._.slugify(this.widgetName);
      var widgetPath = name + '/' + name;
      var widgetCssPath = name + '/_' + name;

      var mainStylePath = 'widgets/_widgets.scss';
      var mainStyle = this.readFileAsString(mainStylePath);

      this.mkdir('widgets/' + name);
      this.template('_widget_plain.js', 'widgets/' + widgetPath + '.js');
      this.template('_widget_plain.scss', 'widgets/' + widgetCssPath + '.scss');

      if (mainStyle) {
        this.write(mainStylePath, 
          mainStyle.replace(protectedStrings.scss,
            '@import \'' + name + '/' + '_' + name + '\';\n    ' + protectedStrings.scss));
      }
    }
  },

  projectfiles: function () {
  }
});

module.exports = VizabiGenerator;
