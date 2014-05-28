'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');


var VizabiGenerator = yeoman.generators.Base.extend({
  init: function () {
  },

  askFor: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Welcome to the marvelous Vizabi generator!'));

    var prompts = [{
      name: 'vizabiName',
      message: 'What would you like to call your new Vizabi?'
    }];

    this.prompt(prompts, function (props) {
      this.vizabiName = props.vizabiName;

      done();
    }.bind(this));
  },

  app: function () {
    this.mkdir('visualizations/' + this.vizabiName);

    var name = this.vizabiName;

    this.template('_vizabi_plain.js', 'visualizations/' + name + '/' + name + '.js');
    this.template('_vizabi_plain.scss', 'visualizations/' + name + '/' + name + '.scss');
  },

  projectfiles: function () {
  }
});

module.exports = VizabiGenerator;
