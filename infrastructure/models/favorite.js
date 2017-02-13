'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var favoriteSchema = new Schema({
	name: String,
	createdOn: { type: Date, default: Date.now },
	updatedOn: { type: Date },
	folderPath: String,
	index: Number
});

module.exports = mongoose.model('Favorite', favoriteSchema);