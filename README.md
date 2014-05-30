viz-external-dev
================

# Starting out

```sh
git clone http://github.com/Gapminder/viz-external-dev vizabi-v2
cd vizabi-v2
git checkout develop
```

Start out by installing the dependencies via bower and npm:

```sh
bower install
npm install
```

# Creating a new visualization

Type, on the root directory:

```sh
yo vizabi
```

This will ask you what you want to create. Two files will be generated: a JavaScript file and a SCSS file, for styles. (todo: overwrite .scss files by default on prompt).

When asked to overwrite `visualizations/vizabi.scss`, type `y`.

Open `visualizations/your-new-viz`. Write your visualization there :) 

# Compiling scss

```sh
grunt sass
```

# View

Edit `test/test.html` and load it into your browser.
