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

Object.prototype.mapOwnProperties = function(callback) {
	var objectMap = {};
	for(var key in this) {
		if(this.hasOwnProperty(key)) {
			objectMap[key] = callback(this[key]);
		}
	}
	return objectMap;
};

Object.prototype.forEachOwnProperties = function(callback) {
	for (var method in this) {
		if (!this.hasOwnProperty(method)) {
			continue;
		}
		callback(this[method]);
	}
};

Object.prototype.getName = function() {
	if (this.name) {
		return this.name.toLowerCase();
	}
	return (this.toString().toLowerCase().trim().match(/^function\s*([^\s(]+)/) || [])[1];
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