function Cache(cacheExpire) {
	var _playlistCache = Object.create(null, {});

	// Do something when app is closing
	process.on('exit', exitHandler);

	// Catches ctrl+c event
	process.on('SIGINT', exitHandler);

	function createOrUpdateItem(group, key, value) {
		if (_playlistCache[group] == null) {
			_playlistCache[group] = Object.create(null, {});
		}
		if (_playlistCache[group][key] == null) {
			_playlistCache[group][key] = Object.create(null, {});
		}
		_playlistCache[group][key].timestamp = new Date();
		_playlistCache[group][key].value = value;

		return _playlistCache[group][key];
	}

	function getItemFromCache(group, key) {
		var playlistCacheGroup = _playlistCache[group];
		if (playlistCacheGroup != null) {
			var cacheItem = playlistCacheGroup[key];
			if (cacheItem != null) {
				return cacheItem.value;
			} else {
				return null;
			}
		}
	}

	function removeItem(group, key) {
		if (_playlistCache[group] == null) {
			return;
		}
		if (_playlistCache[group][key] == null) {
			return;
		}
		_playlistCache[group][key] = null;
	}

	function removeItemsInGroup(group) {
		if (_playlistCache[group] == null) {
			return;
		}
		_playlistCache[group] = null;
	}

	var interval = setInterval(function() {
		for(var groupName in _playlistCache) {
			for(var itemName in _playlistCache[groupName]) {
				if (_playlistCache[groupName][itemName] == null) {
					continue;
				}

				var now = new Date(); // Now
				var ts = _playlistCache[groupName][itemName].timestamp;
				var diff = now - ts; // difference in milliseconds
				if (diff >= cacheExpire) {
					_playlistCache[groupName][itemName] = null;
				}
			}
		}
	}, 1000);

	function exitHandler() {
		if (interval != null) {
			clearInterval(interval);
		}
	}

	return {
		createOrUpdateItem: createOrUpdateItem,
		getItemFromCache: getItemFromCache,
		removeItem: removeItem,
		removeItemsInGroup: removeItemsInGroup
	}
}

module.exports = new Cache(10*60*1000);