Rx.Observable.prototype.silentSubscribe = function () {
	return this.subscribe(
		function (_) {
		},
		function (err) {
			console.log(err)
		}
	);
};

Rx.Observable.prototype.asAsyncValue = function() {
	return this.take(1);
};

Rx.Observable.prototype.whereIsDefined = function() {
	return this.where(function(obj) { return angular.isDefined(obj) });
};

Rx.Observable.prototype.whereIsNotNull = function() {
	return this.where(function(obj) { return obj !== null });
};

Rx.Observable.prototype.whereHasValue = function() {
	return this.where(function(obj) { return angular.isDefined(obj) && obj !== null });
};

Rx.Observable.prototype.whereIsFalse = function() {
	return this.where(function(boolean) { return boolean === false });
};

Rx.Observable.prototype.whereIsTrue = function() {
	return this.where(function(boolean) { return boolean === true });
};

Rx.Observable.prototype.selectUnit = function() {
	return this.select(function(__) {return {}});
};

Rx.Observable.prototype.selectWithPreviousValue = function(selector) {
	var previousValue = null;
	return this.select(function(sel) {
		var local = selector(previousValue, sel);
		previousValue = sel;
		return local;
	});
};

Rx.Observable.prototype.doAsync = Rx.Observable.prototype.getValueAsync = function(callback) {
	this.asAsyncValue()
		.do(callback)
		.silentSubscribe();
};