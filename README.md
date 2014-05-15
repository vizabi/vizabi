viz-external-dev
================

# Starting out

After cloning this repository, you will have to install additional packages
that are used in the development of Vizabi. To do this, run from the command
line:

```sh
bower install
```

The current dependency list on `bower.json` reads:

```json
"dependencies": {
    "d3": "~3.4.6",
    "jed": "~0.5.4",
    "jquery": "~2.1.0",
    "sprintf": "*",
    "i18n-js": "https://github.com/Gapminder/i18n-js.git#develop"
  },
  "devDependencies": {
    "requirejs": "~2.1.11"
  }
```

# CSS

The CSS is build using compass. The directory is `css`. This will be moved to
the Grunt builder.
