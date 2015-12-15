'use strict';

var path = require('path');
var gulp = require('gulp');
var del = require('del')
var slash = require('slash')
var gutil = require('gulp-util');
var chalk = require('chalk')
var gulpif = require('gulp-if');
var pkg = require('./package');

var sass = require('gulp-ruby-sass');
var minifycss = require('gulp-minify-css');
var scsslint = require('gulp-scss-lint');
var cache = require('gulp-cached');
var mem_cache = require('gulp-memory-cache');
var prefix = require('gulp-autoprefixer');

//useful for ES6 module loader
var rollup = require('rollup');
var uglify = require("gulp-uglify");
var glob = require('glob');
var fs = require('fs');
var q = require('q');

//useful for ES5 build
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var foreach = require('gulp-foreach');
var es = require('event-stream');

var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var wrapper = require('gulp-wrapper');

var connect = require('gulp-connect');
var opn = require('opn');
var os = require('os');
var watch = require('gulp-watch');
var wait = require('gulp-wait');

var jade = require('gulp-jade');
var zip = require('gulp-zip');
var bump = require('gulp-bump');

// ----------------------------------------------------------------------------
//   Config
// ----------------------------------------------------------------------------

var config = {
  src: './src',
  srcPreview: './preview',
  dest: './build',
  destLib: './build/dist',
  destPreview: './build/preview',
  destDownload: './build/download',
  destDocs: './build/docs',
  modules: './node_modules'
};

// ----------------------------------------------------------------------------
//   Clean build folder
// ----------------------------------------------------------------------------

gulp.task('clean', function() {
  return del([config.dest]);
});

gulp.task('clean:css', function() {
  return del([path.join(config.destLib, '**/*.css')]);
});

gulp.task('clean:js', function() {
  return del([
    path.join(config.destLib, '**/*.js'),
    path.join(config.destLib, '**/*.js.map')
  ]);
});

gulp.task('clean:indexes', function() {
  return del([path.join(config.src, '**/_index.js')]);
});

gulp.task('clean:preview', function() {
  return del([config.destPreview]);
});

gulp.task('clean:preview:html', function() {
  return del([path.join(config.destPreview, '**/*.html')]);
});

gulp.task('clean:preview:styles', function() {
  return del([path.join(config.destPreview, 'assets/css/main.css')]);
});

gulp.task('clean:preview:js', function() {
  return del([path.join(config.destPreview, 'assets/js/*.js')]);
});

gulp.task('clean:preview:vendor', function() {
  return del([path.join(config.destPreview, 'assets/vendor/**/*')]);
});

gulp.task('clean:preview:data', function() {
  return del([path.join(config.destPreview, 'data')]);
});


// ----------------------------------------------------------------------------
//   Styles
// ----------------------------------------------------------------------------

gulp.task('scss-lint', function() {
  return gulp.src(path.join(config.src, '**/*.scss'))
    .pipe(cache('scsslint'))
    .pipe(scsslint())
    .pipe(scsslint.failReporter())
    .on('end', function() {
      gutil.log(chalk.green("Linting SCSS... DONE!"));
    });;
});

function compileSass(src, dest) {
  return sass(src, {
      style: 'compact'
    })
    .on('error', sass.logError)
    .pipe(prefix({
      browsers: ["last 1 version", "> 1%", "ie 8", "ie 7", "safari 8"]
    }))
    .pipe(minifycss())
    .pipe(gulp.dest(dest));
}

gulp.task('styles', ['scss-lint', 'clean:css'], function() {
  gutil.log(chalk.yellow("Building CSS..."));
  return compileSass(path.join(config.src, 'assets/styles/vizabi.scss'), config.destLib)
    .on('end', function() {
      gutil.log(chalk.green("Building CSS... DONE!"))
    });
});

// ----------------------------------------------------------------------------
//   Javascript
// ----------------------------------------------------------------------------

function strToFile(string, name) {
  var src = require('stream').Readable({
    objectMode: true
  });
  src._read = function() {
    this.push(new gutil.File({
      cwd: "",
      base: "",
      path: name,
      contents: new Buffer(string)
    }));
    this.push(null);
  }
  return src;
}

//TODO: better way to create index?
function buildImportIndex(folder, subfolder) {
  var deferred = q.defer();
  var search = (subfolder) ? '*/*.js' : '*.js';
  var header = '//file automatically generated during build process\n';
  //delete if exists
  del(path.join(folder, '_index.js'));

  glob(path.join(folder, search), {}, function(err, matches) {
    var str_top = [],
      str_middle = [],
      str_btm = [];
    for(var i = 0; i < matches.length; i++) {
      var name = path.basename(matches[i], '.js');
      var rel_path = slash(path.relative(folder, matches[i]));
      str_top.push('import ' + name + ' from \'./' + rel_path + '\';');
      str_middle.push(name + ',');
      str_btm.push(name + ' : ' + name + ',');
    }
    str_top = str_top.join('\n');
    str_middle = '\nexport {\n' + str_middle.join('\n') + '\n};';
    str_btm = '\nexport default {\n' + str_btm.join('\n') + '\n};';
    var contents = header + str_top + str_middle + str_btm;
    fs.writeFileSync(path.join(folder, '_index.js'), contents);
    deferred.resolve();
  });
  return deferred.promise;
}

function formatTemplateFile(str, filename) {
  var content = str.replace(/'/g, '\"')
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/\s+/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "");
  return "(function() {" +
    "var root = this;" +
    "var s = root.document.createElement('script');" +
    "s.type = 'text/template';" +
    "s.setAttribute('id', '" + filename + "');" +
    "s.innerHTML = '" + content + "';" +
    "root.document.body.appendChild(s);" +
    "}).call(this);";
}

function getTemplates(cb) {
  glob(path.join(config.src, '**/*.html'), {}, function(err, matches) {
    var contents = [];
    for(var i = 0; i < matches.length; i++) {
      var data = fs.readFileSync(matches[i]).toString();
      contents.push(formatTemplateFile(data, path.basename(matches[i])));
    }
    cb(contents.join(''));
  });
}

//resolve path when finding modules
function resolvePath(id, importer, options) {
  //if starts with ".", follow strict path
  if(/^\./.test(id)) return path.resolve(path.dirname(importer), id).replace(/\.js$/, "") + ".js";
  //else, try to find it
  var importee = id.replace(/\.js$/, "");
  var pat = path.join(config.src,'/**/',importee.replace(/\//g, '/**/')+'.js');
  var match = glob.sync(pat);
  if(match.length > 0) return path.resolve('./', match[0]);
  else return id;
}

//build JS with banner and/or sourcemaps
//TODO: improve code quality
var buildLock = false;
function buildJS(dev, cb) {
  buildLock = true;
  getTemplates(function(templates) {
    var banner_str = ['/**',
      ' * ' + pkg.name + ' - ' + pkg.description,
      ' * @version v' + pkg.version,
      ' * @link ' + pkg.homepage,
      ' * @license ' + pkg.license,
      ' */',
      ''
    ].join('\n');

    //var version = '; Vizabi._version = "' + pkg.version + '";';
    var version = ';(function (Vizabi) {Vizabi._version = "' + pkg.version + '";})(typeof Vizabi !== "undefined"?Vizabi:{});';

    var options = {
      format: 'umd',
      banner: banner_str,
      footer: version + templates,
      moduleName: 'Vizabi',
      dest: path.join(config.destLib, 'vizabi.js')
    };

    gutil.log(chalk.yellow("Bundling JS..."));

    var entryFile = gutil.env.custom || 'gapminder';
    entryFile = (entryFile != 'false') ? 'vizabi-' + entryFile + '.js' : 'vizabi.js';

    gutil.log(chalk.yellow(" > entry file: " + entryFile));

    rollup.rollup({
      entry: './' + path.join(config.src, entryFile),
      resolveId: resolvePath
    }).then(function(bundle) {
      if(dev) {
        generateSourceMap(bundle, success);
      } else {
        generateMinified(bundle, success);
      }
    }, function(err) {
      gutil.log(chalk.red("Bundling JS... ERROR!"));
      gutil.log(chalk.red(err));
      buildLock = false;
      cb(false);
    });

    function generateSourceMap(bundle, cb) {
      options.sourceMap = true;
      bundle.write(options).then(cb);
    }

    function generateMinified(bundle, cb) {
      var generated = bundle.generate(options);
      strToFile(generated.code, 'vizabi.js')
        .pipe(gulp.dest(config.destLib))
        .pipe(uglify({
          preserveComments: 'license'
        }))
        .pipe(rename('vizabi.min.js'))
        .on('error', function(err) {
          gutil.log(chalk.red("Bundling JS... ERROR!"));
          gutil.log(err);
          buildLock = false;
        })
        .pipe(gulp.dest(config.destLib))
        .on('end', function() {
          buildLock = false;
          cb();
        });
    }

    function success() {
      gutil.log(chalk.green("Bundling JS... DONE!"));
      buildLock = false;
      cb();
    }
  });
}

gulp.task('buildIndexes', ['clean:indexes'], function() {
  return q.all([
    buildImportIndex(path.join(config.src, '/components/'), true),
    buildImportIndex(path.join(config.src, '/components/dialogs'), true),
    buildImportIndex(path.join(config.src, '/models/')),
    buildImportIndex(path.join(config.src, '/readers/'))
  ]);
});

//with source maps
gulp.task('bundle', ['clean:js', 'buildIndexes'], function(cb) {
  buildJS(true, cb);
});

gulp.task('buildJS', function() {
  if (!buildLock)
    gulp.run('bundle');
  else
    gutil.log(chalk.yellow('NEXT BUILD DISCONTINUED: previous build process is still running.'));
});

//without source maps and with banner
gulp.task('bundle:build', ['clean:js', 'buildIndexes'], function(cb) {
  buildJS(false, cb);
});


// ----------------------------------------------------------------------------
//   Preview page
// ----------------------------------------------------------------------------

gulp.task('preview:templates', ['clean:preview:html'], function() {
  gutil.log(chalk.yellow("Compiling preview page..."));
  return gulp.src(path.join(config.srcPreview, '*.jade'))
    .pipe(jade())
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
  gulp.src(path.join(config.modules, 'font-awesome/css/font-awesome.min.css'))
    .pipe(gulp.dest(path.join(config.destPreview, 'assets/vendor/css')));
  gulp.src(path.join(config.modules, 'font-awesome/fonts/*'))
    .pipe(gulp.dest(path.join(config.destPreview, 'assets/vendor/fonts')));
  gulp.src(path.join(config.modules, 'd3/d3.min.js'))
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


var previewDeps = ['preview:templates', 'preview:styles', 'preview:js', 'preview:vendor'];
if(!gutil.env.faster) {
  previewDeps.push('preview:data');
}
else {
  gutil.log(chalk.yellow("DATA NOT CLEANED."));
}

gulp.task('preview', previewDeps, function(cb) {
  return cb();
});

// ----------------------------------------------------------------------------
//   Watch for changes
// ----------------------------------------------------------------------------

//reload only once every 3000ms
var reloadLock = false;

function notLocked() {
  if(!reloadLock) {
    setTimeout(function() {
      reloadLock = false;
    }, 3000);
    reloadLock = true;
  }
  return reloadLock;
}

function reloadOnChange(files) {
  watch(files)
    .pipe(wait(800))
    .pipe(gulpif(notLocked, connect.reload()));
}

gulp.task('watch', function() {
  gulp.watch(path.join(config.srcPreview, '**/*.jade'), ['preview:templates']);
  gulp.watch(path.join(config.srcPreview, '**/*.scss'), ['preview:styles']);
  gulp.watch(path.join(config.srcPreview, '**/*.js'), ['preview:js']);
  gulp.watch(path.join(config.src, '**/*.scss'), ['styles']);
  gulp.watch([path.join(config.src, '**/*.js'), '!' + path.join(config.src, '**/_index.js')], ['buildJS']);
  gulp.watch(path.join(config.src, '**/*.html'), ['buildJS']);
  //reloading the browser
  reloadOnChange(path.join(config.destPreview, '**/*.js'));
  reloadOnChange(path.join(config.destPreview, '**/*.html'));
  reloadOnChange(path.join(config.destPreview, '**/*.css'));
  reloadOnChange(path.join(config.destLib, 'vizabi.css'));
  reloadOnChange(path.join(config.destLib, 'vizabi.js'));
});

gulp.task('watch-lint', function() {
  gulp.watch(path.join(config.src, '**/*.js'), ['eslint']);
});

// ----------------------------------------------------------------------------
//   Web Server
// ----------------------------------------------------------------------------

gulp.task('connect', ['styles', 'bundle', 'preview'], function() {
  var webserver = {
    port: 9000,
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

gulp.task('compress', ['styles', 'bundle:build', 'preview'], function() {
  return gulp.src(path.join(config.destLib, '**/*'))
    .pipe(zip('vizabi.zip'))
    .pipe(gulp.dest(config.destDownload));
});

// ----------------------------------------------------------------------------
//   Bump version
// ----------------------------------------------------------------------------

gulp.task('bump', function() {
  var src = gulp.src(['./bower.json', './package.json']);
  var version = gutil.env.version;
  var type = gutil.env.type;

  if(!version && !type) type = 'patch';
  if(version) src = src.pipe(bump({
    version: version
  }));
  else if(type) src = src.pipe(bump({
    type: type
  }));

  return src.pipe(gulp.dest('./'));
});

// ----------------------------------------------------------------------------
//   Command-line tasks
// ----------------------------------------------------------------------------

//Build Vizabi
gulp.task('build', ['compress']);

//Developer task without linting
gulp.task('dev', ['watch', 'connect']);

//Serve = build + connect
gulp.task('serve', ['build', 'connect']);

//Default = dev task
gulp.task('default', ['dev']);