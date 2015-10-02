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
var prefix = require('gulp-autoprefixer')

//useful for ES6 module loader
var rollup = require('gulp-rollup');

//useful for ES5 build
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var foreach = require('gulp-foreach');
var es = require('event-stream');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
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
  bower: './lib'
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

//TODO: better way?
function buildImportIndex(folder, subfolder) {

  var search = (subfolder) ? '*/*.js' : '*.js';
  //delete if exists
  del(path.join(folder, '_index.js'));

  //write index
  var top = gulp.src(path.join(folder, search))
    .pipe(foreach(function(stream, file) {
      return strToFile([
        'import ' + path.basename(file.path, '.js') + ' from ',
        '\'./' + slash(path.relative(folder, file.path)) + '\';'
      ].join(''), path.basename(file.path));
    }))
    .pipe(concat('_top.js'));

  var bottom = gulp.src(path.join(folder, search))
    .pipe(foreach(function(stream, file) {
      return strToFile(path.basename(file.path, '.js') + ',', path.basename(file.path));
    }))
    .pipe(concat('_bottom.js'))
    .pipe(wrapper({
      header: '\nexport {\n',
      footer: '\n};'
    }));

  return es.merge(top, bottom)
    .pipe(concat('_index.js'))
    .pipe(wrapper({
      header: '//file automatically generated during build process\n'
    }))
    .pipe(gulp.dest(folder));
}

function formatTemplateFile(str, filename) {
  var content = str.replace(/'/g, '\"')
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/\s+/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "");
  content = "(function() {" +
    "var root = this;" +
    "var s = root.document.createElement('script');" +
    "s.type = 'text/template';" +
    "s.setAttribute('id', '" + filename + "');" +
    "s.innerHTML = '" + content + "';" +
    "root.document.body.appendChild(s);" +
    "}).call(this);";

  var src = require('stream').Readable({
    objectMode: true
  });

  return strToFile(content, filename);
}

function getTemplates() {
  return gulp.src('./src/**/*.html')
    .pipe(foreach(function(stream, file) {
      return formatTemplateFile(file.contents.toString('utf8'), path.basename(file.path)).pipe(uglify());
    })).pipe(mem_cache('templateFiles'));
}

//build JS with banner and/or sourcemaps
function buildJS(dev) {

  var banner_str = ['/**',
    ' * ' + pkg.name + ' - ' + pkg.description,
    ' * @version v' + pkg.version,
    ' * @link ' + pkg.homepage,
    ' * @license ' + pkg.license,
    ' */',
    ''
  ].join('\n');

  var version_str = '; Vizabi._version = "' + pkg.version + '";';

  gutil.log(chalk.yellow("Bundling JS..."));

  var src = es.merge(getConcatFiles(), getTemplates());

  if(dev) {
    src = src.pipe(sourcemaps.init())
      .pipe(concat('vizabi.js'))
      .pipe(wrapper({
        footer: version_str
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.destLib));
  } else {
    src = src.pipe(concat('vizabi.js'))
      .pipe(wrapper({
        footer: version_str
      }))
      .pipe(wrapper({
        header: banner_str
      }))
      .pipe(gulp.dest(config.destLib))
      .pipe(rename('vizabi.min.js'))
      .pipe(uglify())
      .pipe(wrapper({
        header: banner_str
      }))
      .pipe(gulp.dest(config.destLib));
  }

  return src.on('end', function() {
    gutil.log(chalk.green("Bundling JS... DONE!"))
  });

}

gulp.task('buildIndexes', ['clean:indexes'], function() {
  return es.merge(
    buildImportIndex(path.join(config.src, '/components/'), true),
    buildImportIndex(path.join(config.src, '/components/buttonlist/dialogs'), true),
    buildImportIndex(path.join(config.src, '/models/')),
    buildImportIndex(path.join(config.src, '/readers/'))
  );
});

gulp.task('bundle', ['clean:js', ['buildIndexes']], function() {

  gutil.log(chalk.yellow("Bundling JS..."));

  gulp.src(path.join(config.src, 'vizabi.js'), {
      read: false
    })
    .pipe(rollup({
      format: 'umd',
      moduleName: 'Vizabi',
      banner: '/* Vizabi version 0.7.5 */',
      footer: '/* FOOTER */'
    }))
    .on('error', function(e) {
      gutil.log(chalk.red("Bundling JS... ERROR!"));
      gutil.log(e);
    })
    .pipe(gulp.dest(config.destLib))
    .on('end', function() {
      gutil.log(chalk.green("Bundling JS... DONE!"));
    });
});

//with source maps
gulp.task('javascript', ['clean:js'], function() {
  return buildJS(true);
});

//without source maps and with banner
gulp.task('javascript:build', ['clean:js'], function() {
  return buildJS();
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


gulp.task('preview', ['preview:templates', 'preview:styles', 'preview:js', 'preview:vendor', 'preview:data'], function(
  cb) {
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
  gulp.watch(path.join(config.src, '**/*.js'), ['javascript']);
  gulp.watch(path.join(config.src, '**/*.html'), ['javascript']);
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

gulp.task('connect', ['preview'], function() {
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

gulp.task('compress', ['styles', 'javascript:build', 'preview'], function() {
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
gulp.task('dev', ['styles', 'bundle', /*'watch',*/ 'connect']);

//Serve = build + connect
gulp.task('serve', ['build', 'connect']);

//Default = dev task
gulp.task('default', ['dev']);