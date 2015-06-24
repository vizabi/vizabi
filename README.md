![Gapminder Vizabi 0.4](http://static.gapminder.org/vizabi/vizabi.jpg)

(Please note; Vizabi is work in progress! Vizabi 1.0.0 will be the public Alpha release of the framework, and we're not there yet). [![Build Status](https://secure.travis-ci.org/Gapminder/vizabi.png?branch=develop)](https://travis-ci.org/Gapminder/vizabi) [![Code Climate](https://codeclimate.com/github/Gapminder/vizabi/badges/gpa.svg)](https://codeclimate.com/github/Gapminder/vizabi)


##What is Vizabi?

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

```sh
npm install
bower install
```

You may need to run ```npm install``` with administrative privilages.


In order to build the project, type the following:
```sh
grunt build
```

You can find the build output under ```dist/```.

In order to run the project in **development mode**, type the following:
```sh
grunt dev
```

In order to build the project with Gapminder's custom options, run one of the following:
```sh
#build project
grunt build --custom=gapminder
#build and serve project
grunt dev --custom=gapminder
```

####Testing

Current tests are written in the folder `specs/`. In order to run them, type the following:
```sh
grunt test
```

If you want to see them running in a browser, type:
```sh
grunt test:browser
```


## Contribution

You can contribute to the development of tools or the framework.

Here are some of the things we would love to improve:

- Development of awesome visualization tools
- Improvement of QA and testing routines
- More readers that support various data formats
- More buttons and UI controls
- Offline support
  
## License

The source code is released under the BSD open source license.

      BSD LICENSE
    
      Copyright (c) 2012, Gapminder Foundation
    
      All rights reserved.
    
      Redistribution and use in source and binary forms, with or without
      modification, are permitted provided that the following conditions are met:
          * Redistributions of source code must retain the above copyright
            notice, this list of conditions and the following disclaimer.
          * Redistributions in binary form must reproduce the above copyright
            notice, this list of conditions and the following disclaimer in the
            documentation and/or other materials provided with the distribution.
          * Neither the name of the Gapminder Foundation nor the
            names of its contributors may be used to endorse or promote products
            derived from this software without specific prior written permission.
      
      THIS SOFTWARE IS PROVIDED BY the Gapminder Foundation ''AS IS'' AND ANY
      EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
      WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
      DISCLAIMED. IN NO EVENT SHALL Gapminder Foundation BE LIABLE FOR ANY
      DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
      (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
      LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
      ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
      (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
      SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

