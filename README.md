Gapminder Vizabi
================

Gapminder Vizabi is our framework for developing data visualizations supporting mobile devices, responsiveness, localization, embedding support and unified data schema.

## Overview

This repo consists of:

* the different components that together build up the Vizabi library
* build scripts and wrapper code that creates the files that are supposed to be distributed to end-users

# Quickstart

```sh
git clone http://github.com/Gapminder/vizabi
cd vizabi
git checkout develop
```

This project uses npm, grunt and bower. For npm, you will need Node.js installed. Then, run the following commands:

```sh
npm install -g bower grunt-cli
npm install
bower install
```

In order to build the project in development mode, type the following.
```sh
grunt dev
```

*If you omit the option dev, the project will be built in the dist folder, but will not run on a local server*

# Examples

The examples folder contains several examples of Vizabi tools in action. Check them out.

## Development Process

(to be defined)
