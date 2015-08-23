# Gapminder Vizabi

You can contribute to the development of tools or the framework.

Here are some of the things we would love to improve:

- Development of awesome visualization tools
- Improvement of QA and testing routines
- More readers that support various data formats
- More buttons and UI controls
- Offline support

## Cloning the repository

Vizabi depends on [Git] (http://git-scm.com/), [Npm](https://github.com/npm/npm), [Bower](https://github.com/bower/bower), [Grunt](https://github.com/gruntjs/grunt) and [Sass](http://sass-lang.com/install).

Clone this repo and run the following commands:

```shell
npm install
bower install
```

## Testing

Current tests are written in the folder `specs/`. In order to run them, type the following:

```shell
grunt test
```

If you want to see them running in a browser, type:

```shell
grunt test:browser
```

## Build the project

In order to build the project, type the following:

```shell
grunt build
```

You can find the build output under ```dist/``` folder.

In order to run the project in **development mode**, type the following:

```shell
grunt dev
```

In order to build the project with Gapminder's custom options, run one of the following:

```shell
grunt build --custom=gapminder # build project
grunt dev --custom=gapminder # build and serve project
```
