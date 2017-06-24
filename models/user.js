var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var findOrCreate = require('mongoose-findorcreate')
var bcrypt = require('bcrypt');
var SALT = bcrypt.genSaltSync();
var jwt = require('jsonwebtoken');
var SECRET = '\x1f\x1e1\x8a\x8djO\x9e\xe4\xcb\x9d`\x13\x02\xfb+\xbb\x89q"F\x8a\xe0a';
var userSchema = new Schema({
    name: String,
    username: {type: String, index: true, unique: true},
    password_hash: String,
});

userSchema.methods.set_password = function(password) {
    this.password_hash = bcrypt.hashSync(password, SALT);
};

userSchema.methods.checkPassword = function(password) {
    return bcrypt.compareSync(password,this.password_hash);
};

userSchema.statics.generateToken = function(username) {
    return jwt.sign({ username: username }, SECRET);
};

userSchema.statics.verifyToken = function(token,cb) {
    if (!token) {
        cb(null);
        return;
    }
    jwt.verify(token, SECRET, function(err, decoded) {
        if (!decoded) {
            cb(null);
            return;
        }
        User.findOne({username: decoded.username},function(err,user) {
	        if (err) {
		        cb(null);
	        } else {
		        cb(user);
	        }
	    });
    });
};

userSchema.plugin(findOrCreate);
var User = mongoose.model('users', userSchema);
module.exports = User;
