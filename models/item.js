var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var findOrCreate = require('mongoose-findorcreate')
var User = require('./user.js');
var itemSchema = new Schema({
    user: {type: ObjectId, ref: 'users'},
    video: String,
    title: String,
    type: String,
    isfavorite: Boolean,
    created: {type: Date, default: Date.now},
});

itemSchema.set('toJSON', {
    virtuals: true
});

itemSchema.plugin(findOrCreate);
var Item = mongoose.model('items', itemSchema);
module.exports = Item;
