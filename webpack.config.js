const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const SassLintPlugin = require('sasslint-webpack-plugin');

const archiver = require('archiver');

const extractSrc = new ExtractTextPlugin('dist/vizabi.css');
const extractPreview = new ExtractTextPlugin('preview/assets/css/main.css');

const __PROD__ = process.env.NODE_ENV === 'production';
const sep = '\\' + path.sep;
const stats = {
  colors: true,
  hash: false,
  version: false,
  timings: true,
  assets: false,
  chunks: false,
  modules: false,
  reasons: true,
  children: false,
  source: false,
  errors: true,
  errorDetails: true,
  warnings: false,
  publicPath: false
};

function AfterBuildPlugin(callback) {
  this.callback = callback;
}
AfterBuildPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', this.callback);
};

const plugins = [
  new CleanWebpackPlugin(['build']),
  extractSrc,
  extractPreview,
  new CopyWebpackPlugin([
    {
      from: '.data/',
      to: 'preview/data/'
    },
    {
      from: 'preview/assets/js/',
      to: 'preview/assets/js/'
    }
  ]),
  new OpenBrowserPlugin({
    url: 'http://localhost:8080/preview/'
  }),
  new SassLintPlugin({
    quiet: false,
    syntax: 'scss',
    glob: 'src/**/*.s?(a|c)ss',
    ignorePlugins: ['extract-text-webpack-plugin']
  }),
];

if (__PROD__) {
  plugins.push(
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        screw_ie8: true,
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    }),
    new AfterBuildPlugin(() => {
      fs.mkdirSync(path.resolve(__dirname, 'build', 'download'));

      const archive = archiver('zip');
      const files = [
        'vizabi.css',
        'vizabi.js'
      ];

      files.forEach(name =>
        archive.append(
          fs.createReadStream(path.resolve('build', 'dist', name)),
          { name }
        )
      );

      archive.pipe(
        fs.createWriteStream(path.resolve('build', 'download', 'vizabi.zip'))
      );
      archive.bulk([
          { expand: true, cwd: 'src/assets/cursors', src: ["**/*"], dot: true, dest: 'assets/cursors'},
          { expand: true, cwd: 'src/assets/translation', src: ["en.json"], dot: true, dest: 'assets/translation'}
      ]);
      archive.finalize();
    })
  )
}

module.exports = {
  devtool: __PROD__ ? 'source-map' : 'eval',

  entry: {
    'dist/vizabi': './src/vizabi-gapminder',
    'preview': './preview/index'
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    library: 'Vizabi'
  },

  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ]
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        // exclude: /node_modules/, // TODO: uncomment after fix export default in interpolators module
        loader: 'babel',
        query: {
          cacheDirectory: !__PROD__,
          presets: ['es2015'],
          plugins: ['add-module-exports']
        }
      },
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        loader: extractSrc.extract([
          `css?${JSON.stringify({ sourceMap: true, minimize: __PROD__ })}`,
          'sass'
        ])
      },
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, 'preview')
        ],
        loader: extractPreview.extract(['css', 'sass'])
      },
      {
        test: /\.cur$/,
        loader: 'file',
        query: {
          name: 'dist/assets/cursors/[name].[ext]'
        }
      },
      {
        test: /\.pug$/,
        loaders: [
          'file?name=[path][name].html',
          'pug-html?exports=false&pretty'
        ]
      },
      {
        test: /\.css$/,
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'file',
        query: {
          name: 'preview/assets/vendor/css/[name].[ext]'
        }
      },
      {
        test: /\.(otf|eot|svg|ttf|woff2?)$/,
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'file',
        query: {
          name: 'preview/assets/vendor/fonts/[name].[ext]'
        }
      },
      {
        test: /(d3\.min|\.web)\.js$/, // TODO: we need another way to extract vendor files
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'file',
        query: {
          name: 'preview/assets/vendor/js/[1]/[name].[ext]',
          regExp: new RegExp(`${sep}node_modules${sep}([^${sep}]+?)${sep}`)
        }
      },
      {
        test: /\.html$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'html',
        query: {
          interpolate: 'require'
        }
      },
      {
        test: __PROD__ ? /en\.json$/ : /\.json$/,
        include: [path.resolve(__dirname, 'src', 'assets', 'translation')],
        loader: 'file',
        query: {
          name: `${__PROD__ ? 'dist' : 'preview'}/assets/translation/[name].[ext]`
        }
      }
    ]
  },

  plugins,

  stats,
  devServer: {
    stats
  }
};
