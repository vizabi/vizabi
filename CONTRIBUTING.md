# Gapminder Vizabi

You can contribute to the development of tools or the framework. Read the manual [how we collaborate](https://docs.google.com/document/d/1UOXjD0SKxN7vDQGC31ddVd-kaVXClSCzfGPvYjqQrFQ/edit?usp=sharing)

## Cloning the repository

Vizabi depends on [Git](http://git-scm.com/) and [Npm](https://github.com/npm/npm).

**Installation Requirements For Mac Users**

1. Install git http://git-scm.com/download/mac
2. Install nodejs https://nodejs.org/en/

Alternative:
Install [docker](https://docs.docker.com/engine/installation/)


**Clone this repo** and run the following commands in vizabi root folder:

```shell
npm install
```

If you are still puzzled what it is or it just doesn't work, read a [more detailed instruction](https://github.com/Gapminder/vizabi/wiki/Quickstart-for-Windows)
(it's for Windows, but you'll figure things out if you have a Mac or Linux)

## Build the project

In order to run the project in **development mode**, type the following:

```shell
npm start
```

Open browser on `http://localhost:8080/preview/`

In order to only build the project, type the following (you'll rarely need this).
Build will be created using Docker (Image of Ubuntu 14.04):

```shell
npm run build
```

Build without Docker can be done via:

```shell
npm run build:prod
```

In both cases find the build output under ```build/``` folder.

**Note:** On Vizabi publishing build will be done using Docker (```npm run build```).
