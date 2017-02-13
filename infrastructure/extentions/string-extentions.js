String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
	return this.match(suffix+"$") == suffix;
};

String.prototype.count = function(pattern) {
	var occurences = 0;
	var startIndex = 0;
	do {
		startIndex = this.indexOf(pattern, startIndex);
		if (startIndex < 0) {
			break;
		}
		occurences++;
		startIndex += pattern.length;
	}
	while (startIndex >= 0);

	return occurences;
};

module.exports = String;