# Gapminder Tools page
> This is the gapminder tools page

Code for page: [http://gapminder.org/tools](http://gapminder.org/tools)

## Requirements

- [Node and npm](http://nodejs.org)
- [Ruby](http://ruby-lang.com/)
- [Sass](http://sass-lang.com/) : `gem install sass`
- [MongoDB](https://www.mongodb.org/)

## Dev requirements
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

1. Start API server via `PORT=3001 npm start` or via `PORT 3001 node server/server.js`
2. `npm run dev` - will start webpack with watch and hot reload
3. View in browser at `http://localhost:8080/tools/`

## Update vizabi
```bash
npm i vizabi@latest -S
```
###Obs:
*if you change default configuration for mongoDB, you need to configure `server/app/config/database.js` accordingly*
