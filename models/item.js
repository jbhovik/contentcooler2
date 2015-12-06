// setup Mongoose
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var findOrCreate = require('mongoose-findorcreate')

var User = require('./user.js');

// Item schema
var itemSchema = new Schema({
    user: {type: ObjectId, ref: 'users'},
    video: String,
    created: {type: Date, default: Date.now},
});

// ensure schemas use virtual IDs
itemSchema.set('toJSON', {
    virtuals: true
});

// add findorCreate
itemSchema.plugin(findOrCreate);

// create item
var Item = mongoose.model('items', itemSchema);

module.exports = Item;


