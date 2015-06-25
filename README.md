![Gapminder Vizabi 0.4](http://static.gapminder.org/vizabi/vizabi.jpg)

(Please note; Vizabi is work in progress! Vizabi 1.0.0 will be the public Alpha release of the framework, and we're not there yet).
[![Build Status](https://secure.travis-ci.org/Gapminder/vizabi.png?branch=develop)](https://travis-ci.org/Gapminder/vizabi)
[![Code Climate](https://codeclimate.com/github/Gapminder/vizabi/badges/gpa.svg)](https://codeclimate.com/github/Gapminder/vizabi)

## What is Vizabi?

Gapminder Vizabi is a framework for developing visual exploration tools.

The main features are:

1. Embeddable tools with customization
2. Responsive layout
3. Support for UI Controls & Interaction
4. Translation & Localization
5. Unified data-schema for multi dimensional statistics.

You can use Vizabi to create a new visualization based on your data or modify our set of vizualization tools.

See our example pages here: [Vizabi Examples](http://static.gapminderdev.org/vizabi/develop/preview/)
Checkout documentation here: [Vizabi Examples](http://static.gapminderdev.org/vizabi/docs/)

## Setup & Quickstart

Vizabi depends on [Git] (http://git-scm.com/), [Npm](https://github.com/npm/npm), [Bower](https://github.com/bower/bower), [Grunt](https://github.com/gruntjs/grunt) and [Sass](http://sass-lang.com/install)

Clone this repo and run the following commands:

```shell
npm install
bower install
```

You may need to run ```npm install``` with administrative privileges.

In order to build the project, type the following:
```shell
grunt build
```

You can find the build output under ```dist/```.

In order to run the project in **development mode**, type the following:

```shell
grunt dev
```

In order to build the project with Gapminder's custom options, run one of the following:

```shell
#build project
grunt build --custom=gapminder
#build and serve project
grunt dev --custom=gapminder
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

## License

Copyright (c) 2012-2015, Gapminder Foundation

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
