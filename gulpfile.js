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
var watch = require('gulp-watch');
var wait = require('gulp-wait');

var jade = require('gulp-jade');

// ----------------------------------------------------------------------------
//   Config
// ----------------------------------------------------------------------------

var config = {
  src: './src',
  srcPreview: './preview',
  dest: './dist',
  destLib: './dist/lib',
  destPreview: './dist/preview',
  bower: './lib'
};

// ----------------------------------------------------------------------------
//   Clean dist folder
// ----------------------------------------------------------------------------

function clean_src(arr) {
  return gulp.src(arr, {
      read: false
    })
    .pipe(clean());
}

gulp.task('clean', function() {
  return clean_src([config.dest]);
});

gulp.task('clean:css', function() {
  return clean_src([path.join(config.destLib, '**/*.css')]);
});

gulp.task('clean:js', function() {
  return clean_src([
    path.join(config.destLib, '**/*.js'),
    path.join(config.destLib, '**/*.js.map')
  ]);
});

gulp.task('clean:preview', function() {
  return clean_src([config.destPreview]);
});

gulp.task('clean:preview:html', function() {
  return clean_src([path.join(config.destPreview, '**/*.html'),]);
});

gulp.task('clean:preview:styles', function() {
  return clean_src([path.join(config.destPreview, 'assets/css/main.css'),]);
});

gulp.task('clean:preview:js', function() {
  return clean_src([path.join(config.destPreview, 'assets/js/*.js'),]);
});

gulp.task('clean:preview:vendor', function() {
  return clean_src([path.join(config.destPreview, 'assets/vendor/**/*'),]);
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

function compileSass(src, dest) {
  return sass(src, {
      style: 'compact'
    })
    .on('error', sass.logError)
    .pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
    .pipe(minifycss())
    .pipe(gulp.dest(dest));
}

gulp.task('styles', ['clean:css'], function() {
  gutil.log(chalk.yellow("Building CSS..."));
  return compileSass(path.join(config.src, 'assets/styles/vizabi.scss'), config.destLib)
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
    .pipe(gulp.dest(config.destLib))
    .pipe(rename('vizabi.min.js'))
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    // capture sourcemaps from transforms
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.destLib))
    .on('end', function() {
      gutil.log(chalk.green("Compiling JS... DONE!"))
    });
}

gulp.task('watchify', ['clean:js'], function() {
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
gulp.task('browserify', ['clean:js'], function() {
  var bundler = browserify(path.join(config.src, 'vizabi.js'), {
    debug: true
  }).transform(babelify, { /* options */ })
  return bundle_js(bundler);
});

// Without sourcemaps
gulp.task('browserify-production', ['clean:js'], function() {
  gutil.log(chalk.yellow("Compiling JS..."));
  var bundler = browserify(path.join(config.src, 'vizabi.js')).transform(babelify, { /* options */ });
  return bundler.bundle()
    .on('error', nice_error)
    .pipe(source('vizabi.js'))
    .pipe(buffer())
    .pipe(gulp.dest(config.destLib))
    .pipe(rename('vizabi.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(config.destLib))
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
//   Preview page
// ----------------------------------------------------------------------------

gulp.task('preview:templates', ['clean:preview:html'], function() {
  gutil.log(chalk.yellow("Compiling preview page..."));
  var YOUR_LOCALS = {};
  return gulp.src(path.join(config.srcPreview, '*.jade'))
    .pipe(jade({
      locals: {},
      pretty: true
    }))
    .pipe(gulp.dest(config.destPreview))
    .on('end', function() {
      gutil.log(chalk.green("Compiling preview page... DONE!"))
    });
});

gulp.task('preview:styles', ['clean:preview:styles'], function() {
  gutil.log(chalk.yellow("Building preview CSS..."));
  return compileSass(path.join(config.srcPreview, 'assets/css/main.scss'), path.join(config.destPreview, 'assets/css'))
    .on('end', function() {
      gutil.log(chalk.green("Building preview CSS... DONE!"))
    });
});

gulp.task('preview:js', ['clean:preview:js'], function() {
  gutil.log(chalk.yellow("Copying preview JS..."));
  return gulp.src(path.join(config.srcPreview, 'assets/js/*.js'))
      .pipe(gulp.dest(path.join(config.destPreview, 'assets/js')))
      .on('end', function() {
        gutil.log(chalk.green("Copying preview JS... DONE!"))
      });
});

gulp.task('preview:vendor', ['clean:preview:vendor'], function() {
  gulp.src(path.join(config.bower, 'font-awesome/css/font-awesome.min.css'))
      .pipe(gulp.dest(path.join(config.destPreview, 'assets/vendor/css')));
  gulp.src(path.join(config.bower, 'font-awesome/fonts/*'))
      .pipe(gulp.dest(path.join(config.destPreview, 'assets/vendor/fonts')));
  gulp.src(path.join(config.bower, 'd3/d3.min.js'))
      .pipe(gulp.dest(path.join(config.destPreview, 'assets/vendor/js')));
});

gulp.task('preview', ['preview:templates', 'preview:styles', 'preview:js', 'preview:vendor'], function(cb) {
  return cb();
});

// ----------------------------------------------------------------------------
//   Watch for changes
// ----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch(path.join(config.srcPreview, '**/*.jade'), ['preview:templates']);
  gulp.watch(path.join(config.srcPreview, '**/*.scss'), ['preview:styles']);
  gulp.watch(path.join(config.srcPreview, '**/*.js'), ['preview:js']);
  gulp.watch(path.join(config.src, '**/*.scss'), ['styles']);

  watch(path.join(config.destPreview, '**/*'))
      .pipe(wait(800))
      .pipe(connect.reload());
});

gulp.task('watch-lint', function() {
  gulp.watch(path.join(config.src, '**/*.js'), ['eslint']);
});

// ----------------------------------------------------------------------------
//   Web Server
// ----------------------------------------------------------------------------

gulp.task('connect', ['preview'], function() {
  var webserver = {
    port: 8080,
    root: config.dest,
    livereload: true
  };

  var browser = os.platform() === 'linux' ? 'google-chrome' : (
    os.platform() === 'darwin' ? 'google chrome' : (
      os.platform() === 'win32' ? 'chrome' : 'firefox'));

  connect.server(webserver);
  opn('http://localhost:' + webserver.port + '/preview/', {
    app: browser
  });
});

// ----------------------------------------------------------------------------
//   Command-line tasks
// ----------------------------------------------------------------------------

//Build Vizabi
gulp.task('build', ['styles', 'browserify-production', 'preview']);

//Developer task
gulp.task('dev', ['styles', 'eslint', 'watch-lint', 'watchify', 'watch', 'connect']);

//Developer task without linting
gulp.task('dev:nolint', ['styles', 'watchify', 'watch', 'connect']);

//Serve = build + connect
gulp.task('serve', ['build', 'connect']);

//Default = dev task
gulp.task('default', ['dev']);