'use strict';

var path = require('path');
var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require('gulp-util');
var chalk = require('chalk')

var sass = require('gulp-ruby-sass');
var minifycss = require('gulp-minify-css');
var scsslint = require('gulp-scss-lint');

var cache = require('gulp-cached');
var prefix = require('gulp-autoprefixer');

var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge = require('utils-merge');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

var eslint = require('gulp-eslint');
var connect = require('gulp-connect');
var opn = require('opn');
var os = require('os');

var config = {
  src: './src',
  dest: './dist',
  preview: './preview'
};

// ----------------------------------------------------------------------------
//   Web Server
// ----------------------------------------------------------------------------

gulp.task('connect', function() {
  var webserver = {
    port: 8080,
    root: config.previewDest,
    livereload: true
  };

  var browser = os.platform() === 'linux' ? 'google-chrome' : (
    os.platform() === 'darwin' ? 'google chrome' : (
      os.platform() === 'win32' ? 'chrome' : 'firefox'));

  connect.server(webserver);
  opn('http://localhost:' + webserver.port, { app: browser });
});

// ----------------------------------------------------------------------------
//   Clean dist folder
// ----------------------------------------------------------------------------

gulp.task('clean', function() {
  return gulp.src('./dist', {
      read: false
    })
    .pipe(clean());
});

// ----------------------------------------------------------------------------
//   Styles
// ----------------------------------------------------------------------------

// TODO: Add SCSS Linting
// gulp.task('scss-lint', function() {
//   return gulp.src(path.join(config.src, '**/*.scss'))
//     .pipe(cache('scsslint'))
//     .pipe(scsslint());
// });

gulp.task('styles', function() {
  gutil.log(chalk.yellow("Building CSS..."));
  sass(path.join(config.src, 'assets/styles/vizabi.scss'), {
      style: 'compact'
    })
    .on('error', sass.logError)
    .pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
    .pipe(minifycss())
    .pipe(gulp.dest(config.dest))
    .pipe(connect.reload())
    .on('end', function() {
      gutil.log(chalk.green("Building CSS... DONE!"))
    });
});

// ----------------------------------------------------------------------------
//   Javascript
// ----------------------------------------------------------------------------

// nicer browserify errors
function nice_error(err) {
  if(err.fileName) {
    // regular error
    gutil.log(chalk.red(err.name) + ': ' + chalk.yellow(err.fileName.replace(__dirname + '/src/js/', '')) + ': ' +
      'Line ' + chalk.magenta(err.lineNumber) + ' & ' + 'Column ' + chalk.magenta(err.columnNumber || err.column) +
      ': ' + chalk.blue(err.description));
  } else {
    // browserify error..
    gutil.log(chalk.red(err.name) + ': ' + chalk.yellow(err.message));
  }
}

// reusable bundler
function bundle_js(bundler) {
  gutil.log(chalk.yellow("Compiling JS..."));
  return bundler.bundle()
    .on('error', nice_error)
    .pipe(source('vizabi.js'))
    .pipe(buffer())
    .pipe(gulp.dest(config.dest))
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    // capture sourcemaps from transforms
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.dest))
    .pipe(connect.reload())
    .on('end', function() {
      gutil.log(chalk.green("Compiling JS... DONE!"))
    });
}

gulp.task('watchify', function() {
  var args = merge(watchify.args, {
    debug: true
  })
  var bundler = watchify(browserify(path.join(config.src, 'vizabi.js'), args)).transform(babelify, { /* opts */ });
  bundle_js(bundler);
  bundler.on('update', function() {
    bundle_js(bundler);
  })
});

// With source maps
gulp.task('browserify', function() {
  var bundler = browserify(path.join(config.src, 'vizabi.js'), {
    debug: true
  }).transform(babelify, { /* options */ })
  return bundle_js(bundler);
});

// Without sourcemaps
gulp.task('browserify-production', function() {
  gutil.log(chalk.yellow("Compiling JS..."));
  var bundler = browserify(path.join(config.src, 'vizabi.js')).transform(babelify, { /* options */ });
  return bundler.bundle()
    .on('error', nice_error)
    .pipe(source('vizabi.js'))
    .pipe(buffer())
    .pipe(rename('vizabi.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(config.dest))
    .on('end', function() {
      gutil.log(chalk.green("Compiling JS... DONE!"))
    });
});

gulp.task('eslint', function() {
  return gulp.src([path.join(config.src, '**/*.js')])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// ----------------------------------------------------------------------------
//   Watch for changes
// ----------------------------------------------------------------------------
gulp.task('watch-css', function() {
  gulp.watch(path.join(config.src, '**/*.scss'), ['styles']);
});

gulp.task('watch-lint', function() {
  gulp.watch(path.join(config.src, '**/*.js'), ['eslint']);
});

// ----------------------------------------------------------------------------
//   Command-line tasks
// ----------------------------------------------------------------------------

//Build Vizabi
gulp.task('build', ['clean', 'styles', 'browserify-production']);

//Developer task
gulp.task('dev', ['clean', 'styles', 'eslint', 'watch-lint', 'watchify', 'watch-css', 'connect']);

//Developer task without linting
gulp.task('dev:nolint', ['clean', 'styles', 'watchify', 'watch-css']);

//Serve = build + connect
gulp.task('serve', ['build', 'connect']);

//Default = dev task
gulp.task('default', ['dev']);