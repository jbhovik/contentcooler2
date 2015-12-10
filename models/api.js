var app = require('./express.js');
var User = require('./user.js');
var Item = require('./item.js');
var multiparty = require('multiparty');
var fs = require('fs');
var path = require("path");
var url = require("url");
var util = require('util');
    
// setup body parser
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
        extended: true
}));

//
// API
//

// register a user
app.post('/api/users/register', function (req, res) {
    // find or create the user with the given username
    User.findOrCreate({username: req.body.username}, function(err, user, created) {
        if (created) {
            // if this username is not taken, then create a user record
            user.name = req.body.name;
            user.set_password(req.body.password);
            user.currMovie = req.body.currMovie;
            user.save(function(err) {
		if (err) {
		    res.sendStatus("403");
		    return;
		}
                // create a token
		var token = User.generateToken(user.username);
                // return value is JSON containing the user's name and token
                res.json({name: user.name, token: token});
            });
        } else {
            // return an error if the username is taken
            res.sendStatus("403");
        }
    });
});



// login a user
app.post('/api/users/login', function (req, res) {
    // find the user with the given username
    User.findOne({username: req.body.username}, function(err,user) {
	if (err) {
	    res.sendStatus(403);
	    return;
	}
        // validate the user exists and the password is correct
        if (user && user.checkPassword(req.body.password)) {
            // create a token
            var token = User.generateToken(user.username);
            // return value is JSON containing user's name and token
            res.json({name: user.name, token: token});
        } else {
            res.sendStatus(403);
        }
    });
});

// get all items for the user
app.get('/api/items', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, find all the user's items and return them
	    Item.find({user:user.id}, function(err, items) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
		// return value is the list of items as JSON
		res.json({items: items});
	    });
        } else {
            res.sendStatus(403);
        }
    });
});

// get the one item for user movie playing
app.get('/api/item/:item_id', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, find all the user's items and return them
        Item.find({user:user.id}, function(err, items) {
        if (err) {
            res.sendStatus(403);
            return;
        }
        // return value is the list of items as JSON
        res.json({items: items});
        });
        } else {
            res.sendStatus(403);
        }
    });
});

// add an item
app.post('/api/items', function (req,res) {
    // validate the supplied token
    // get indexes
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // Parse the movie
            var form = new multiparty.Form();
            form.parse(req, function(err, fields, files) {
            var video_path = String(files.file1[0].path);
            var file_name = String(files.file1[0].originalFilename);
            var video_name_array = video_path.split('/');
            var video_name = video_name_array[video_name_array.length - 1];
            var full_path = path.join(__dirname, '../public/movies', video_name);
            fs.rename(video_path,  full_path, function (err) {
            if (err) {
                console.log(err);
            }
            });
            Item.create({video:video_name,title:file_name,user:user.id}, function(err, item) {
            if (err) {
                res.sendStatus(403);
                return;
            }
            res.json({item:item});
            });
            });
	    } else {
            res.sendStatus(403);
        }
    });
});

// add the currMovie to the user
app.put('/api/users', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            user.currMovie = req.body.currMovie;
                user.save(function(err) {
            if (err) {
            res.sendStatus(403);
            return;
            }
                    // return value is the item as JSON
                    res.json({user:user});
                });
        } else {
            res.sendStatus(403);
        }
    });
});

// get user's current movie
app.get('/api/getCurrMovie', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            var currMovie = user.currMovie;
            var full_path = path.join(__dirname, '../public/movies', currMovie);

            try {
                // Query the entry
                var stat = fs.statSync(full_path);
            }
            catch (e) {
                currMovie = '';
                user.currMovie = '';
                user.save(function(err) {
                    if (err) {
                        res.sendStatus(403);
                    return;
                    }
                    // return value is the item as JSON
                });
            }
            res.json({currMovie:currMovie});
        } else {
            res.sendStatus(403);
        }
    });
});

// get an item for playing the movie
app.get('/api/items/:item_id', function (req,res) {
    // validate the supplied token
    //user = User.verifyToken(req.headers.authorization, function(user) {
       
        //if (user) {
            
            // if the token is valid, get the file from the path
            var full_path = path.join(__dirname, '../public/movies', req.params.item_id);
            console.log(full_path);

            try {
                // Query the entry
                var stat = fs.statSync(full_path);
            }
            catch (e) {
                res.sendStatus(403);
                return;
            }

            var total = stat.size;
            if (req.headers['range']) {
                var range = req.headers.range;
                var parts = range.replace(/bytes=/, "").split("-");
                var partialstart = parts[0];
                var partialend = parts[1];

                var start = parseInt(partialstart, 10);
                var end = partialend ? parseInt(partialend, 10) : total-1;
                var chunksize = (end-start)+1;
                console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

                var file = fs.createReadStream(full_path, {start: start, end: end});
                res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
                file.pipe(res);
            } else {
                console.log('ALL: ' + total);
                res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
                fs.createReadStream(full_path).pipe(res);
            }
        // } else {
        //     console.log('step 6');
        //     res.sendStatus(403);
        // }
    //});
});

// update an item
app.put('/api/items/:item_id', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, then find the requested item
            Item.findById(req.params.item_id, function(err,item) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
                // update the item if it belongs to the user, otherwise return an error
                if (item.user != user.id) {
                    res.sendStatus(403);
		    return;
                }
                item.title = req.body.item.title;
                item.completed = req.body.item.completed;
                item.save(function(err) {
		    if (err) {
			res.sendStatus(403);
			return;
		    }
                    // return value is the item as JSON
                    res.json({item:item});
                });
	    });
        } else {
            res.sendStatus(403);
        }
    });
});

// delete an item
app.delete('/api/items/:item_id', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, then find the requested item
            Item.findByIdAndRemove(req.params.item_id, function(err,item) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
        // Remove the file
        var full_path = path.join(__dirname, '../public/movies', item.video);
        fs.unlink(full_path, function (err) {
        if (err) {
            console.log('Error in delete one movie');
        }
        });
            res.sendStatus(200);
        });
        } else {
            res.sendStatus(403);
        }
    });
});

