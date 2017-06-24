# Content Cooler

Content Cooler is web app where you can store and view your content,
all protected under your individual login. Movies, music, and pictures can be enjoyed.
Your library contains a list of content and an uploader for files, as well as a favorites list.

## Dependencies

- [Node.js](https://nodejs.org/)
- [Express](http://expressjs.com/)
- [Mongoose](http://mongoosejs.com/)
- [mongoose-find-or-create](https://github.com/drudge/mongoose-findorcreate)
- [body-parser](https://github.com/expressjs/body-parser)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [bcrypt-nodejs](https://github.com/ncb000gt/node.bcrypt.js)
- [react-global](https://github.com/captivationsoftware/react-global)
- [multiparty](https://github.com/andrewrk/node-multiparty)
- [react](https://github.com/andrewrk/node-multiparty)

## Installation

First install node.js:

```
sudo apt-get install nodejs npm
```

Next, install dependencies:

```
npm install
```

## Run the app

```
node app.js
```

This will start a server on the supplied host, which you can visit at http://hostname:3000/

## To drop all mongo databases

```
mongo dropall.js
```

This will drop all databases in mongo if you change a schema

