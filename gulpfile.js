'use strict';

var path = require('path');
var gulp = require('gulp');
var clean = require('gulp-clean');

var sass = require('gulp-ruby-sass');
var minifycss = require('gulp-minify-css');
var scsslint = require('gulp-scss-lint');

var cache = require('gulp-cached');
var prefix = require('gulp-autoprefixer');

var config = {
  src: './src',
  dest: './dist'
};

// ----------------------------------------------------------------------------
//   Clean dist folder
// ----------------------------------------------------------------------------

gulp.task('clean', function() {
  return gulp.src([
      path.join(config.dest, '**/*.js'),
      path.join(config.dest, '**/*.css'),
      path.join(config.dest, '**/*.map'),
      path.join(config.dest, '**/*.gz')
    ])
    .pipe(clean());
});

// ----------------------------------------------------------------------------
//   Styles
// ----------------------------------------------------------------------------

gulp.task('scss-lint', function() {
  return gulp.src(path.join(config.src, '**/*.scss'))
    .pipe(cache('scsslint'))
    .pipe(scsslint());
});

gulp.task('styles', function() {
  sass(path.join(config.src, 'assets/styles/vizabi.scss'), {
      style: 'compact'
    })
    .on('error', sass.logError)
    .pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
    .pipe(minifycss())
    .pipe(gulp.dest('dist'));
});

// ----------------------------------------------------------------------------
//   Javascript
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
//   Watch for changes
// ----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch('/src/**/*.scss', ['scss-lint', 'styles']);
});

// ----------------------------------------------------------------------------
//   Default tasks
// ----------------------------------------------------------------------------

gulp.task('default', ['scss-lint', 'styles']);