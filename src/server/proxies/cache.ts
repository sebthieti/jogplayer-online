import * as process from 'process';
import Timer = NodeJS.Timer;

export interface ICache {
  createOrUpdateItem(group, key, value);
  getItemFromCache(group, key);
  removeItem(group, key);
  removeItemsInGroup(group);
}

export default class Cache implements ICache {
  private playlistCache = {};

  constructor(cacheExpire = 10 * 60 * 1000) {
    const interval = this.setupSlidingExpiration(cacheExpire);

    // Do something when app is closing
    process.on('exit', () => this.exitHandler(interval));

    // Catches ctrl+c event
    process.on('SIGINT', () => this.exitHandler(interval));
  }

  createOrUpdateItem(group, key, value) {
    if (this.playlistCache[group] == null) {
      this.playlistCache[group] = Object.create(null, {});
    }
    if (this.playlistCache[group][key] == null) {
      this.playlistCache[group][key] = Object.create(null, {});
    }
    this.playlistCache[group][key].timestamp = new Date();
    this.playlistCache[group][key].value = value;

    return this.playlistCache[group][key];
  }

  getItemFromCache(group, key) {
    const playlistCacheGroup = this.playlistCache[group];
    if (playlistCacheGroup != null) {
      const cacheItem = playlistCacheGroup[key];
      if (cacheItem != null) {
        return cacheItem.value;
      } else {
        return null;
      }
    }
  }

  removeItem(group, key) {
    if (this.playlistCache[group] == null) {
      return;
    }
    if (this.playlistCache[group][key] == null) {
      return;
    }
    this.playlistCache[group][key] = null;
  }

  removeItemsInGroup(group) {
    if (this.playlistCache[group] == null) {
      return;
    }
    this.playlistCache[group] = null;
  }

  private exitHandler(interval: Timer) {
    if (interval != null) {
      clearInterval(interval);
    }
  }

  private setupSlidingExpiration(cacheExpire: number): Timer {
    return setInterval(() => {
      for (const groupName in this.playlistCache) {
        for (const itemName in this.playlistCache[groupName]) {
          if (this.playlistCache[groupName][itemName] == null) {
            continue;
          }

          const now = new Date(); // Now
          const ts = this.playlistCache[groupName][itemName].timestamp;
          const diff = now - ts; // difference in milliseconds
          if (diff >= cacheExpire) {
            this.playlistCache[groupName][itemName] = null;
          }
        }
      }
    }, 1000);
  }
}
