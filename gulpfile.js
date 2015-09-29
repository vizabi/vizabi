'use strict';

var path = require('path');
var gulp = require('gulp');
var del = require('del')
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

//useful for ES5 build
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var foreach = require('gulp-foreach');
var es = require('event-stream');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var header = require('gulp-header');

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

//with source maps
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

//without source maps and with banner
gulp.task('javascript:build', ['clean:js'], function() {

  var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

  gutil.log(chalk.yellow("Bundling JS..."));
  return es.merge(getConcatFiles(), getTemplates())
    .pipe(concat('vizabi.js'))
    .pipe(header(banner, { pkg : pkg } ))
    .pipe(gulp.dest(config.destLib))
    .pipe(rename('vizabi.min.js'))
    .pipe(uglify())
    .pipe(header(banner, { pkg : pkg } ))
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

//reload only once every 3000ms
var reloadLock = false;
function notLocked() {
  if(!reloadLock) {
    setTimeout(function() { reloadLock = false; }, 3000);
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

gulp.task('compress', ['styles', 'javascript:build', 'preview'], function () {
    return gulp.src(path.join(config.destLib, '**/*'))
        .pipe(zip('vizabi.zip'))
        .pipe(gulp.dest(config.destDownload));
});

// ----------------------------------------------------------------------------
//   Bump version
// ----------------------------------------------------------------------------

gulp.task('bump', function(){
  var src = gulp.src(['./bower.json', './package.json']);
  var version = gutil.env.version;
  var type = gutil.env.type;

  if(!version && !type) type = 'patch';
  if(version) src = src.pipe(bump({version:version}));
  else if(type) src = src.pipe(bump({type:type}));

  return src.pipe(gulp.dest('./'));
});

// ----------------------------------------------------------------------------
//   Command-line tasks
// ----------------------------------------------------------------------------

//Build Vizabi
gulp.task('build', ['compress']);

//Developer task without linting
gulp.task('dev', ['styles', 'javascript', 'watch', 'connect']);

//Serve = build + connect
gulp.task('serve', ['build', 'connect']);

//Default = dev task
gulp.task('default', ['dev']);
