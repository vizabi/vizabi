# Gapminder Vizabi

You can contribute to the development of tools or the framework. Read the manual [how we collaborate](https://docs.google.com/document/d/1UOXjD0SKxN7vDQGC31ddVd-kaVXClSCzfGPvYjqQrFQ/edit?usp=sharing)

## Cloning the repository

Vizabi depends on [Git] (http://git-scm.com/), [Npm](https://github.com/npm/npm), [Bower](https://github.com/bower/bower), [Sass](http://sass-lang.com/install), and [SCSS Lint](https://github.com/brigade/scss-lint) `gem install scss-lint`.

Clone this repo and run the following commands:

```shell
npm install
bower install
```

If you are still puzzled what it is or it just doesn't work, read a [more detailed instruction](https://github.com/Gapminder/vizabi/wiki/Quickstart-for-Windows) 
(it's for Windows, but you'll figure things out if you have a Mac or Linux)

## Build the project

In order to run the project in **development mode**, type the following:

```shell
gulp
```

The browser will open on `http://localhost:8080/preview/`

In order to only build the project, type the following (you'll rarely need this):

```shell
gulp build
```

You can find the build output under ```build/``` folder.
