# Gapminder Vizabi

You can contribute to the development of tools or the framework. Read the manual [how we collaborate](https://docs.google.com/document/d/1UOXjD0SKxN7vDQGC31ddVd-kaVXClSCzfGPvYjqQrFQ/edit?usp=sharing)

## Running vizabi locally

**Dependencies**

Vizabi depends on [Git](http://git-scm.com/) and [Npm](https://github.com/npm/npm).  

1. Install git http://git-scm.com/download/mac
2. Install nodejs https://nodejs.org/en/

**Building barebones Vizabi with preview page**

Clone this repo and [vizabi-preview](https://github.com/vizabi/vizabi-preview), so that they end up in the adjacent folders.  
Go to vizabi. Run `npm install`  
Go to vizabi-preview. Run `npm install`, `npm link ../vizabi`, `npm start`  
Open browser on `http://localhost:8080/`  
  
In order to only build the project for distribution/publishing, run `npm run build:prod` in vizabi  
The build output will be under ```build/``` folder.  

**Building Vizabi with tools and preview page**

Vizabi tools are now moved to their own repos. To build the tools, clone them into respective folders next to vizabi and vizabi-preview, run `npm install` in each tool folder.  

Go to vizabi-preview, run `npm link ../vizabi-tool-name`, `npm start`   

For convenience we have a script link.sh, that links all the tools. You can edit it so that it only includes tools you've cloned and run it by calling `npm run link`
