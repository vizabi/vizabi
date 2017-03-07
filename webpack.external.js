const pkg = require('./package.json');

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const SassLintPlugin = require('sasslint-webpack-plugin');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
const customLoader = require('custom-loader');

const archiver = require('archiver');

const extractSrc = new ExtractTextPlugin('dist/vizabi.css');

const __PROD__ = process.env.NODE_ENV === 'production';
const timestamp = new Date();

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
  warnings: true,
  publicPath: false
};

function AfterBuildPlugin(callback) {
  this.callback = callback;
}
AfterBuildPlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', this.callback);
};

customLoader.loaders = {
  ['config-loader'](source) {
    this.cacheable && this.cacheable();

    const value = typeof source === 'string' ? JSON.parse(source) : source;
    this.value = [value];
    return `var VIZABI_MODEL = ${JSON.stringify(value, undefined, '  ')};`;
  }
};

const loaders = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loaders: [
      {
        loader: 'babel-loader',
        query: {
          cacheDirectory: !__PROD__,
          presets: ['es2015']
        }
      }
    ]
  },
  {
    test: /\.scss$/,
    include: [
      path.resolve(__dirname, 'src')
    ],
    loader: extractSrc.extract([
      {
        loader: 'css-loader',
        options: {
          minimize: __PROD__,
          sourceMap: true
        }
      },
      {
        loader: 'postcss-loader'
      },
      {
        loader: 'sass-loader'
      }
    ])
  },
  {
    test: /\.cur$/,
    loader: 'file-loader',
    query: {
      publicPath: path => path.split('/').slice(1).join('/'),
      name: 'preview/assets/cursors/[name].[ext]'
    }
  },
  {
    test: /\.html$/,
    include: [path.resolve(__dirname, 'src')],
    loader: 'html-loader'
  },
];

module.exports = output => {
  const plugins = [
    new CleanWebpackPlugin(['build']),
    extractSrc,
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src', 'assets', 'translation'),
        to: path.resolve(output || path.resolve(__dirname, 'build'), 'dist', 'assets', 'translation'),
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src', 'assets', 'cursors'),
        to: path.resolve(output || path.resolve(__dirname, 'build'), 'dist', 'assets', 'cursors')
      }
    ]),
    new SassLintPlugin({
      quiet: false,
      syntax: 'scss',
      glob: 'src/**/*.s?(a|c)ss',
      ignorePlugins: ['extract-text-webpack-plugin']
    }),
    new webpack.DefinePlugin({
      __VERSION: JSON.stringify(pkg.version),
      __BUILD: +timestamp
    })
  ];

  if (__PROD__) {
    plugins.push(
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
      new UnminifiedWebpackPlugin(),
      new AfterBuildPlugin(() => {
        fs.mkdirSync(path.resolve(__dirname, 'build', 'download'));

        const archive = archiver('zip');
        const files = [
          'vizabi.css',
          'vizabi.min.js',
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
        archive.glob('**/*', { cwd: 'src/assets/cursors', dot: true }, { prefix: 'assets/cursors' });
        archive.glob('en.json', { cwd: 'src/assets/translation', dot: true }, { prefix: 'assets/translation' });
        archive.finalize();
      }),
      new webpack.BannerPlugin({
        banner: [
          '/**',
          ' * ' + pkg.name + ' - ' + pkg.description,
          ' * @version v' + pkg.version,
          ' * @build timestamp ' + timestamp,
          ' * @link ' + pkg.homepage,
          ' * @license ' + pkg.license,
          ' */',
          ''
        ].join('\n'),
        raw: true
      })
    )
  }

  return {

    devtool: 'source-map',

    entry: {
      'dist/vizabi': path.resolve(__dirname, 'src', 'vizabi-gapminder'),
    },

    output: {
      path: output || path.resolve(__dirname, 'build'),
      filename: __PROD__ ? '[name].min.js' : '[name].js',
      library: 'Vizabi',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },

    resolveLoader: {
      modules: [
        'web_loaders',
        'web_modules',
        'node_loaders',
        'node_modules',
        path.resolve(__dirname, 'node_modules'),
      ],
    },
    resolve: {
      modules: [
        path.resolve(__dirname, 'src'),
        'node_modules'
      ]
    },

    module: {
      loaders,
    },

    plugins,

  };
};
