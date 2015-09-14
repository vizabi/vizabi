# Gapminder Tools page
> This is the gapminder tools page

Demo: [http://178.62.135.203/](http://178.62.135.203/)

## Requirements

- [Node and npm](http://nodejs.org)
- [Ruby](http://ruby-lang.com/)
- [Sass](http://sass-lang.com/) : `gem install sass`
- [Grunt CLI](http://gruntjs.com/using-the-cli) : `npm install -g grunt-cli`
- [Bower](http://bower.io/) : `npm install -g bower`
- [MongoDB](https://www.mongodb.org/)

## Installation

1. Clone the repository: `git clone git@github.com:Gapminder/gapminder-tools-vizabi.git`
2. Install the application: `npm install & bower install`
3. Build the project: `grunt build`
4. Make sure mongoDB is running: `mongod`
5. Start the server: `node server/server.js`
6. View in browser at `http://localhost:8080`

###Obs:
*if you change default configuration for mongoDB, you need to configure `server/app/config/database.js` accordingly*