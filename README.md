![Gapminder Vizabi 0.4](http://static.gapminder.org/vizabi/vizabi.jpg)

Welcome to the vizabi repository! 

(Please note; Vizabi is work in progress! Vizabi 1.0.0 will be the public Alpha release of the framework, and we're not there yet). [![Build Status](https://secure.travis-ci.org/Gapminder/vizabi.png?branch=develop)](https://travis-ci.org/Gapminder/vizabi) [![Code Climate](https://codeclimate.com/github/Gapminder/vizabi/badges/gpa.svg)](https://codeclimate.com/github/Gapminder/vizabi)


####What is Vizabi?
Vizabi is a framework for building Maintainable Visual Exploration Tools, with consistent support for the following five core features: 1) Embedding with configurations, 2) Responsive layout, 3) Support devices native UI Controls & Interactions, 4) Enable Instant Translation & Localization by end user, 5) Unifying data-schema for multi dimensional statistics.

You can use Vizabi to create a new visualization based on your data or modify our set of vizualization tools.  

####Can I see it in action?
Yes. See our example pages here: [Vizabi Examples](http://static.gapminder.org/vizabi/develop/preview_pages/). If you want to check out even more examples, check our [Vizabi Examples Repo](https://github.com/Gapminder/vizabi-examples).

#### Where can I find full documentation?
See our WIKI for detailed documentation: [Vizabi WIKI](https://github.com/Gapminder/vizabi/wiki/) 


####Javascript Statis Analysis Visualization
[Plato](https://github.com/es-analysis/plato)'s static code analysis of version 0.4 can be found here: [Vizabi Plato ](http://static.gapminder.org/vizabi-recent/report/). 


### QuickStart

*Note 1*: You can watch the screencast on [How to Get Started with Vizabi] (http://vimeo.com/107568568).

*Note 2*: This guide explains how you set up your environment to develop Vizabi. If you just want to use Vizabi, skip this chapter and [move on](https://github.com/Gapminder/vizabi/wiki/How-to-use-Vizabi)

*Note 3*: If you are on Windows platform, we highly recommend using [Cygwin](https://www.cygwin.com/). Cygwin is a large collection of GNU and Open Source tools which provide functionality similar to a Linux distribution on Windows. Cygwin makes your development more efficient with running terminal commands like in UNIX.


####Dependencies
Vizabi depends on [Git] (http://git-scm.com/), [Npm](https://github.com/npm/npm), [Bower](https://github.com/bower/bower) and [Grunt](https://github.com/gruntjs/grunt). 

**Git** Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency. Git's official [Installing Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git) is the best way to install Git.

**Npm** is a package manager for [Nodejs](http://nodejs.org/) and therefore requires [Node.js](http://nodejs.org/) to be installed. Here is a tutorial to install Node: [Installing Node.js via Package Managers](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager). 

**Bower** is a package manager and you can install it with npm (with administrative privillages):
```sh
npm install -g bower
```

**Grunt** is the Javascript task runner and can also be installed with npm (with administrative privillages):
```sh
npm install -g grunt-cli
```

**Ruby and Ruby Gems** are needed for building Vizabi. Here you can find tutorial to install *Ruby* and *Rubygems*:

* [Install Ruby] (https://www.ruby-lang.org/en/installation/)
* [Install Rubygems] (https://rubygems.org/pages/download)

**SASS** is grade CSS extension language. To install it, run the following command with administrative privillages: 

```sh
gem install sass
```

Now that you have all Vizabi's dependencies in place, you can clone and install Vizabi.

####Clone
In order to run vizabi locally, clone it:

```sh
git clone https://github.com/Gapminder/vizabi
cd vizabi
```

*Note*: If you are using any of Github's GUI clients such as [Github for Windows](https://windows.github.com/) or [Github for Mac](https://mac.github.com/), Go to the right-hand side of the project repository homepage, click on *Clone in Desktop*. 

<img src="http://i.imgur.com/S1Bb7H5.png" width=400 height=700 align="middle">

You will be prompt with a window asking your permission to launch your Github GUI client. Allow the execution:


<img src="http://i.imgur.com/fdZQXPV.png" alt="Commercial Photography" width=600 height=400 align="middle">

Click on Clone after selecting the path you want to have Vizabi in and you are good to go.

####Install
Go to Vizabi directory and run the following commands in the terminal:

```sh
npm install
bower install
```


*Note*: You may need to run ```npm install``` with administrative privilages.


####Running and Developing
We use grunt to build Vizabi. You can run Vizabi for Development or Production: ```grunt [dev|build]```.

In order to run the project in development mode, type the following:
```sh
grunt dev
```
With this, Grunt will automatically start a local server and open the example pages in your browser at [http://localhost:9000/](http://localhost:9000/). You can see the list of data visualization examples . Vizabi support Grunt tasks such as ```watch```, ```copy``` to ease development in this mode.

In order to build the project, type the following:
```sh
grunt build
```

You can find the build output under ```dist/```.


### Contribution
 The following list provides some parts that Vizabi will benefit from your contribution:
 * Unit Testing: Write Unit Tests for Vizabi. The priority is with base classes, of course.
 * Tools & Components: Create More tools for Vizabi. [D3js](www.d3js.org) gallery has inspiring examples: [https://github.com/mbostock/d3/wiki/Gallery](D3 Gallery)
 * Styles: Contribute to Vizabi by enhancing the user experience.
  
#### License

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

