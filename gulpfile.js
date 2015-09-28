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
var mem_cache = require('gulp-memory-cache');
var prefix = require('gulp-autoprefixer')

//useful for ES5 build
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var foreach = require('gulp-foreach');

//useful for ES6 build
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge = require('utils-merge');
var es = require('event-stream');

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

var zip = require('gulp-zip');

// ----------------------------------------------------------------------------
//   Config
// ----------------------------------------------------------------------------

var config = {
  src: './src',
  srcPreview: './preview',
  dest: './dist',
  destLib: './dist/lib',
  destPreview: './dist/preview',
  destDownload: './dist/download',
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
  return clean_src([path.join(config.destPreview, '**/*.html'), ]);
});

gulp.task('clean:preview:styles', function() {
  return clean_src([path.join(config.destPreview, 'assets/css/main.css'), ]);
});

gulp.task('clean:preview:js', function() {
  return clean_src([path.join(config.destPreview, 'assets/js/*.js'), ]);
});

gulp.task('clean:preview:vendor', function() {
  return clean_src([path.join(config.destPreview, 'assets/vendor/**/*'), ]);
});

gulp.task('clean:preview:data', function() {
  return clean_src([path.join(config.destPreview, 'data'), ]);
});


// ----------------------------------------------------------------------------
//   Styles
// ----------------------------------------------------------------------------

// TODO: Add SCSS Linting (later, because there are too many errors to fix now)
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

function getConcatFiles() {
  var custom = gutil.env.custom || "gapminder";

  var FILES = {
    base: ['./src/vizabi.js',
      './src/base/utils.js',
      './src/base/promise.js',
      './src/base/class.js',
      './src/base/data.js',
      './src/base/events.js',
      './src/base/intervals.js',
      './src/base/layout.js',
      './src/base/model.js',
      './src/base/component.js',
      './src/base/tool.js',
      './src/base/iconset.js'
    ],
    components: ['./src/components/**/*.js'],
    models: ['./src/models/**/*.js'],
    tools: ['./src/tools/**/*.js'],
    readers: ['./src/readers/**/*.js'],
    plugins: ['./src/plugins/**/*.js'],
    templates: ['./src/**/*.html'],
    custom: ['./src/vizabi_custom/' + custom + '.js']
  }
  var BUILD_FILES = ([]).concat(FILES.base)
    .concat(FILES.components)
    .concat(FILES.models)
    .concat(FILES.readers)
    .concat(FILES.tools)
    .concat(FILES.plugins);

  if(custom) {
    BUILD_FILES = BUILD_FILES.concat(FILES.custom);
  }

  return gulp.src(BUILD_FILES).pipe(mem_cache('jsfiles'));
}

function formatTemplateFile(str, filepath) {
  var content = str.replace(/'/g, '\"')
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/\s+/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "");
  content = "(function() {" +
    "var root = this;" +
    "var s = root.document.createElement('script');" +
    "s.type = 'text/template';" +
    "s.setAttribute('id', '" + filepath + "');" +
    "s.innerHTML = '" + content + "';" +
    "root.document.body.appendChild(s);" +
    "}).call(this);";

  var src = require('stream').Readable({ objectMode: true });
  src._read = function () {
    this.push(new gutil.File({ cwd: "", base: "", path: filepath, contents: new Buffer(content) }));
    this.push(null);
  }
  return src;
}

function getTemplates() {
  return gulp.src('./src/**/*.html')
    .pipe(foreach(function(stream, file) {
      return formatTemplateFile(file.contents.toString('utf8'), path.relative('.', file.path)).pipe(uglify());
    })).pipe(mem_cache('templateFiles'));
}

gulp.task('javascript', ['clean:js'], function() {
  gutil.log(chalk.yellow("Bundling JS..."));
  return es.merge(getConcatFiles(), getTemplates())
    .pipe(sourcemaps.init())
      .pipe(concat('vizabi.js'))
      .pipe(gulp.dest(config.destLib))
      .pipe(rename('vizabi.min.js'))
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.destLib))
    .on('end', function() {
      gutil.log(chalk.green("Bundling JS... DONE!"))
    });
});

gulp.task('javascript:build', ['clean:js'], function() {
  gutil.log(chalk.yellow("Bundling JS..."));
  return es.merge(getConcatFiles(), getTemplates())
    .pipe(concat('vizabi.js'))
    .pipe(gulp.dest(config.destLib))
    .pipe(rename('vizabi.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(config.destLib))
    .on('end', function() {
      gutil.log(chalk.green("Bundling JS... DONE!"))
    });
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
  return compileSass(path.join(config.srcPreview, 'assets/css/main.scss'), path.join(config.destPreview,
      'assets/css'))
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

gulp.task('preview:data', ['clean:preview:data'], function() {
  gutil.log(chalk.yellow("Copying preview data..."));
  return gulp.src('./.data/**/*')
    .pipe(gulp.dest(path.join(config.destPreview, 'data')))
    .on('end', function() {
      gutil.log(chalk.green("Copying preview data... DONE!"))
    });
});


gulp.task('preview', ['preview:templates', 'preview:styles', 'preview:js', 'preview:vendor', 'preview:data'], function(cb) {
  return cb();
});

// ----------------------------------------------------------------------------
//   Watch for changes
// ----------------------------------------------------------------------------

function reloadOnChange(files) {
  watch(files)
    .pipe(wait(800))
    .pipe(connect.reload());
}

gulp.task('watch', function() {
  gulp.watch(path.join(config.srcPreview, '**/*.jade'), ['preview:templates']);
  gulp.watch(path.join(config.srcPreview, '**/*.scss'), ['preview:styles']);
  gulp.watch(path.join(config.srcPreview, '**/*.js'), ['preview:js']);
  gulp.watch(path.join(config.src, '**/*.scss'), ['styles']);
  gulp.watch(path.join(config.src, '**/*.js'), ['javascript']);
  gulp.watch(path.join(config.src, '**/*.html'), ['javascript']);

  reloadOnChange(path.join(config.destPreview, '**/*'));
  reloadOnChange(path.join(config.destLib, 'vizabi.css'));
  reloadOnChange(path.join(config.destLib, 'vizabi.min.js'));
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
//   Compressed file (for download)
// ----------------------------------------------------------------------------

gulp.task('compress', ['styles', 'javascript:build', 'preview'], function () {
    return gulp.src('dist/lib/**/*')
        .pipe(zip('vizabi.zip'))
        .pipe(gulp.dest(config.destDownload));
});

// ----------------------------------------------------------------------------
//   Command-line tasks
// ----------------------------------------------------------------------------

/* TODO: Bring back ES6 builds*/
// //Build Vizabi
// gulp.task('build', ['styles', 'browserify-production', 'preview']);

// //Developer task
// gulp.task('dev', ['styles', 'eslint', 'watch-lint', 'watchify', 'watch', 'connect']);

// //Developer task without linting
// gulp.task('dev:nolint', ['styles', 'watchify', 'watch', 'connect']);

//Build Vizabi
gulp.task('build', ['compress']);

//Developer task without linting
gulp.task('dev', ['styles', 'javascript', 'watch', 'connect']);

//Serve = build + connect
gulp.task('serve', ['build', 'connect']);

//Default = dev task
gulp.task('default', ['dev']);

/*******
TODO: Bring the following tasks back for ES6 and remove concat

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
  var bundler = watchify(browserify(path.join(config.src, 'vizabi.js'), args)).transform(babelify, {});
  bundle_js(bundler);
  bundler.on('update', function() {
    bundle_js(bundler);
  })
});

// With source maps
gulp.task('browserify', ['clean:js'], function() {
  var bundler = browserify(path.join(config.src, 'vizabi.js'), {
    debug: true
  }).transform(babelify, {})
  return bundle_js(bundler);
});

// Without sourcemaps
gulp.task('browserify-production', ['clean:js'], function() {
  gutil.log(chalk.yellow("Compiling JS..."));
  var bundler = browserify(path.join(config.src, 'vizabi.js')).transform(babelify, {});
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

*/

//gulp.task('eslint', function() {
//  return gulp.src([path.join(config.src, '**/*.js')])
//    .pipe(eslint())
//    .pipe(eslint.format())
//    .pipe(eslint.failAfterError());
//});

/* END OF ES6 Tasks */