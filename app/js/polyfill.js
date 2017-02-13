String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
	return this.match(suffix+"$") == suffix;
};

Object.prototype.clone = function() {
	return _.clone(this);
};

Object.prototype.toArray = function() {
	return [ this ];
};

Object.prototype.updateFieldsFrom = function (obj) { // TODO doesn't compare well Arrays
	for (var objField in obj) {
		if (this[objField] !== undefined && this.hasOwnProperty(objField)) {
			if (obj[objField] !== this[objField]) {
				this[objField] = obj[objField];
			}
		}
	}
	return this;
};