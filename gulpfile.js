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

var config = {
  src: './src',
  dest: './dist',
  preview: './preview'
};

// ----------------------------------------------------------------------------
//   Web Server
// ----------------------------------------------------------------------------

gulp.task('connect', function() {
  connect.server({
    root: config.preview,
    livereload: true
  });
});

// ----------------------------------------------------------------------------
//   Clean dist folder
// ----------------------------------------------------------------------------

gulp.task('clean', function() {
  return gulp.src(config.dest, {
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
    .on('end', function() {
      gutil.log(chalk.green("Building CSS... DONE!"))
    });
});

// ----------------------------------------------------------------------------
//   Javascript
// ----------------------------------------------------------------------------

/* nicer browserify errors */
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
/* */

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

// Without watchify
gulp.task('browserify', function() {
  var bundler = browserify(path.join(config.src, 'vizabi.js'), {
    debug: true
  }).transform(babelify, { /* options */ })
  return bundle_js(bundler);
});

// Without sourcemaps
gulp.task('browserify-production', function() {
  var bundler = browserify(path.join(config.src, 'vizabi.js')).transform(babelify, { /* options */ })
  return bundler.bundle()
    .on('error', map_error)
    .pipe(source('vizabi.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(config.dest));
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

gulp.task('build', ['clean', 'styles', 'browserify-production']);
gulp.task('dev', ['clean', 'styles', 'eslint', 'watch-lint', 'watchify', 'watch-css', 'connect']);
gulp.task('dev:nolint', ['clean', 'styles', 'watchify', 'watch-css']);

//Default to dev
gulp.task('default', ['dev']);
