const pkg = require('./package.json');

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const SassLintPlugin = require('sasslint-webpack-plugin');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
const customLoader = require('custom-loader');

const archiver = require('archiver');

const extractSrc = new MiniCssExtractPlugin({
  filename: "vizabi.css"
});

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
  compiler.hooks.done.tap('AfterBuildPlugin', this.callback);
};

customLoader.loaders = {
  ['config-loader'](source) {
    this.cacheable && this.cacheable();

    const value = typeof source === 'string' ? JSON.parse(source) : source;
    this.value = [value];
    return `var VIZABI_MODEL = ${JSON.stringify(value, undefined, '  ')};`;
  }
};

const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          cacheDirectory: !__PROD__,
          presets: ['env']
        }
      }
    ]
  },
  {
    test: /\.scss$/,
    include: [
      path.resolve(__dirname, 'src')
    ],
    use: [
      MiniCssExtractPlugin.loader,
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
    ]
  },
  {
    test: /\.cur$/,
    loader: 'file-loader',
    options: {
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
        to: path.resolve(output || path.resolve(__dirname, 'build'), 'assets', 'translation'),
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src', 'assets', 'cursors'),
        to: path.resolve(output || path.resolve(__dirname, 'build'), 'assets', 'cursors')
      }
    ]),
    new SassLintPlugin({
      configFile: path.resolve(__dirname, '.sass-lint.yml'),
      quiet: false,
      syntax: 'scss',
      glob: 'src/**/*.s?(a|c)ss',
      ignorePlugins: ['extract-text-webpack-plugin']
    }),
    new webpack.DefinePlugin({
      __VERSION: JSON.stringify(pkg.version),
      __BUILD: +timestamp
    }),
    new webpack.BannerPlugin({
      banner: "((function(){})({version: '" + JSON.stringify(pkg.version) + "'}));",
      raw: true,
      test: /\.js$/
    })
  ];

  const optimization = {};

  if (__PROD__) {
    plugins.push(
      new UnminifiedWebpackPlugin(),
      new AfterBuildPlugin(() => {
        const archive = archiver('zip');
        const files = [
          'vizabi.css',
          'vizabi.min.js',
          'vizabi.js'
        ];

        files.forEach(name =>
          archive.append(
            fs.createReadStream(path.resolve('build', name)),
            { name }
          )
        );

        archive.pipe(
          fs.createWriteStream(path.resolve('build', 'vizabi.zip'))
        );
        archive.glob('**/*', { cwd: 'src/assets/cursors', dot: true }, { prefix: 'assets/cursors' });
        archive.glob('en.json', { cwd: 'src/assets/translation', dot: true }, { prefix: 'assets/translation' });
        archive.finalize();
      })
    );

    optimization.minimizer = [
      new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
          compress: {
            warnings: false
          },
          mangle: {
          },
          output: {
            comments: false,
          }
        }
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
    ];
  }

  return {
    mode: __PROD__ ? 'production': 'development',

    performance: {
      hints: false
    },

    devtool: 'source-map',

    entry: {
      'vizabi': path.resolve(__dirname, 'src', 'vizabi-gapminder'),
    },

    output: {
      path: output || path.resolve(__dirname, 'build'),
      filename: __PROD__ ? '[name].min.js' : '[name].js',
      devtoolNamespace: "",
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
      rules,
    },

    optimization,

    plugins

  };
};
