# Content Cooler

Content Cooler is website where you can store and view your content,
all protected under your individual login. Movies and music can be enjoyed.
Your library contains a list of content and an uploader for files.

## Dependencies

    "jsonwebtoken": "~5.0.1",
    "bcrypt": "~0.8.3",
    "multiparty": "~4.1.2",
    "react": "~0.14.3",
    "react-global": "~0.1.8"


- [Node.js](https://nodejs.org/)
- [Express](http://expressjs.com/)
- [Mongoose](http://mongoosejs.com/)
- [mongoose-find-or-create](https://github.com/drudge/mongoose-findorcreate)
- [body-parser](https://github.com/expressjs/body-parser)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [bcrypt-nodejs](https://github.com/ncb000gt/node.bcrypt.js)
- [react-global](https://github.com/captivationsoftware/react-global)


## Installation

First install node.js:

```
sudo yum install nodejs npm
```

Next, install dependencies:

```
npm install
```

## Configure front end

Link the `public` directory to one of the available front ends. For example:

```
ln -s ../listomatic-react/public .
```

The available front ends are:

- [listomatic-react](https://github.com/zappala/listomatic-react)
- [listomatic-angular](https://github.com/zappala/listomatic-angular)
- [listomatic-ember](https://github.com/zappala/listomatic-ember)

## Run the app

```
node app.js
```

This will start a server on localhost, which you can visit at http://localhost:3000/

