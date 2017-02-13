Rx.Observable.prototype.silentSubscribe = function () {
	return this.subscribe(
		function (_) {
		},
		function (err) {
			console.log(err)
		}
	);
};