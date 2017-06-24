var app = require('./express.js');
var User = require('./user.js');
var Item = require('./item.js');
var multiparty = require('multiparty');
var fs = require('fs');
var path = require("path");
var url = require("url");
var util = require('util');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/api/users/register', function (req, res) {
    User.findOrCreate({username: req.body.username}, function(err, user, created) {
        if (created) {
            user.name = req.body.name;
            user.set_password(req.body.password);
            user.currMovie = req.body.currMovie;
            user.save(function(err) {
		    if (err) {
		        res.sendStatus("403");
		        return;
		    }
		    var token = User.generateToken(user.username);
                res.json({name: user.name, token: token});
            });
        } else {
            res.sendStatus("403");
        }
    });
});

app.post('/api/users/login', function (req, res) {
    User.findOne({username: req.body.username}, function(err,user) {
	    if (err) {
	        res.sendStatus(403);
	        return;
	    }
        if (user && user.checkPassword(req.body.password)) {
            var token = User.generateToken(user.username);
            res.json({name: user.name, token: token});
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/items', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
	        Item.find({user:user.id}, function(err, items) {
		        if (err) {
		            res.sendStatus(403);
		            return;
		        }
		        res.json({items: items});
	        });
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/favorites', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.find({user:user.id}, function(err, items) {
                if (err) {
                    res.sendStatus(403);
                    return;
                }
                var favorites = items.filter (function(item) {return item.isfavorite});
                res.json({items: favorites});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/videos', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.find({user:user.id}, function(err, items) {
                if (err) {
                    res.sendStatus(403);
                    return;
                }
                var videos = items.filter (function(item) {
                    if (item.type.indexOf("video") != -1)
                        return true;
                    });
                res.json({items: videos});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/audios', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.find({user:user.id}, function(err, items) {
                if (err) {
                    res.sendStatus(403);
                    return;
                }
                var videos = items.filter (function(item) {
                    if(item.type.indexOf("audio") != -1)
                        return true;
                });
                res.json({items: videos});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/images', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.find({user:user.id}, function(err, items) {
                if (err) {
                    res.sendStatus(403);
                    return;
                }
                var videos = items.filter (function(item) {
                if(item.type.indexOf("image") != -1)
                    return true;
                });
                res.json({items: videos});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/item/:item_id', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.find({user:user.id}, function(err, items) {
                if (err) {
                    res.sendStatus(403);
                    return;
                }
                res.json({items: items});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

app.post('/api/items', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // Parse the movie
            var form = new multiparty.Form();
            form.parse(req, function(err, fields, files) {
                var file_path = String(files.file1[0].path);
                var title_name = String(files.file1[0].originalFilename);
                var file_name_array = file_path.split('/');
                var file_name = file_name_array[file_name_array.length - 1];
                var full_path = path.join(__dirname, '../public/files', file_name);
                fs.rename(file_path,  full_path, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                Item.create({filename:file_name,title:title_name,type:req.headers.type,isfavorite:false,tester:true,user:user.id}, function(err, item) {
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

app.put('/api/users', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            user.currMovie = req.body.currMovie;
            user.save(function(err) {
                if (err) {
                    res.sendStatus(403);
                    return;
                }
                res.json({user:user});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

app.get('/api/items/:item_id', function (req,res) {
    var full_path = path.join(__dirname, '../public/files', req.params.item_id)
    try {
        var stat = fs.statSync(full_path);
    } catch (e) {
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
        var file = fs.createReadStream(full_path, {start: start, end: end});
        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(res);
    } else {
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        fs.createReadStream(full_path).pipe(res);
    }
});

app.put('/api/items/:item_id', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.findById(req.params.item_id, function(err,item) {
        		if (err) {
                    res.sendStatus(403);
                    return;
        		}
                if (item.user != user.id) {
                    res.sendStatus(403);
                    return;
                }
                item.title = req.body.item.title;
                item.isfavorite = req.body.item.isfavorite;
                item.save(function(err) {
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

app.delete('/api/items/:item_id', function (req,res) {
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            Item.findByIdAndRemove(req.params.item_id, function(err,item) {
		        if (err) {
		            res.sendStatus(403);
		            return;
		        }
                var full_path = path.join(__dirname, '../public/files', item.filename);
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

