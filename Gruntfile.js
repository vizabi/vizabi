var path = require('path');

module.exports = function (grunt) {
  /**
   * Deployment keys
   */
  // TODO: move loading deployment keys to separate file
  var aws = {};
  try {
    aws = grunt.file.readJSON('.deploy-keys.json');
  } catch (error) {
    aws = {
      "AWS_ACCESS_KEY_ID": process.env.AWS_ACCESS_KEY_ID,
      "AWS_SECRET_KEY": process.env.AWS_SECRET_KEY,
      "AWS_BUCKET": process.env.AWS_BUCKET || 'static.gapminder.org',
      "AWS_SUBFOLDER": process.env.AWS_SUBFOLDER || 'vizabi',
      "AWS_REGION": 'eu-west-1'
    };
  }

  // TODO: rewrite it with gulp (we want it faster and faster)
  require('load-grunt-config')(grunt, {
    configPath: path.join(process.cwd(), '/grunt/config'),
    loadGruntTasks: {
      config: require('./package.json'),
      scope: 'devDependencies',
      pattern: [
        'grunt-*',
        '@*/grunt-*',
        'jit-grunt'
      ]
    },
    jitGrunt: {
      customTasksDir: 'grunt/tasks'
    },
    data: aws
  });
};
