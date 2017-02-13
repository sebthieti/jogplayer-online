'use strict';

var Dto = function () {
};

Dto.prototype = { // TODO Rename this because a class like folder content should't inherit this

	getDefinedFields: function () {
		var data = {};
		for (var prop in this) {
			if(this.hasOwnProperty(prop) && this[prop] !== undefined) {
				data[prop] = this[prop];
			}
		}
		return data;
	}

};

module.exports = Dto;