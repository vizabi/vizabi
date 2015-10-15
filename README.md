# Gapminder Tools page
> This is the gapminder tools page

Code for page: [http://gapminder.org/tools](http://gapminder.org/tools)

## Requirements

- [Node and npm](http://nodejs.org) *If node was already installed remove node_modules and reinstall after upgrade*
- [Ruby](http://ruby-lang.com/)
- [Sass](http://sass-lang.com/) : `gem install sass`
- [MongoDB](https://www.mongodb.org/)
```bash
# osx
brew install mongodb
# ubuntu
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```
- Redis
```bash
# osx
brew install redis
# ubuntu
sudo apt-get install redis-server
```
- Webpack and webpack dev server
 ```bash
 npm i -g webpack webpack-dev-server
 ```

## Installation

1. Clone the repository: `git clone git@github.com:Gapminder/gapminder-tools-vizabi.git`
2. Make sure mongoDB is running: `mongo`
3. Start the server: `npm start`
4. View in browser at `http://localhost:8080/tools/`

## Development

1. `npm run dev` - start serving UI only on port 8080, uses in memory file system
2. `npm run build` - creates static dev build of UI
3. `npm run deploy` - creates static, production ready UI files
4. `npm start` - starts API and `npm run build`
5. On daily basis you will likely use
```bash
# one terminal or from webstorm
MONGO_URL=mongodb://readme:123123@ds033744.mongolab.com:33744/gampinder-tools-dev node server/server.js
# second terminal
npm run dev
# open http://localhost:8080/tools/bubbles
```

###Troubleshooting:

If an error for redis is displayed, make sure it's running: `redis-cli`

## Update vizabi
```bash
npm i vizabi@latest -S
```
###Obs:
*if you change default configuration for mongoDB, you need to configure `server/app/config/database.js` accordingly*
