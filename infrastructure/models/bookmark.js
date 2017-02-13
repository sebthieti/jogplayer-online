'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var bookmarkSchema = new Schema({
	name: String,
	comment: String,
	position: Number
});

module.exports = mongoose.model('Bookmark', bookmarkSchema);