import * as process from 'process';
import Timer = NodeJS.Timer;

export interface ICache {
  upsertItem(group: string, key: string, value: any): ICacheData;
  getItemFromCache<T>(group: string, key: string): T;
  removeItem(group: string, key: string);
  removeItemsInGroup(group: string);
}

export interface ICacheGroups {
  [key: string]: ICacheSubGroups;
}

export interface ICacheSubGroups {
  [key: string]: ICacheData;
}

export interface ICacheData {
  timestamp: Date;
  value: any;
}

export default class Cache implements ICache {
  private playlistCache: ICacheGroups = {};

  constructor(cacheExpire = 10 * 60 * 1000) {
    const interval = this.setupSlidingExpiration(cacheExpire);

    // Do something when app is closing
    process.on('exit', () => this.exitHandler(interval));

    // Catches ctrl+c event
    process.on('SIGINT', () => this.exitHandler(interval));
  }

  upsertItem(group: string, key: string, value: any): ICacheData {
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

  getItemFromCache<T>(group: string, key: string): T {
    const playlistCacheGroup = this.playlistCache[group];
    if (playlistCacheGroup != null) {
      const cacheItem = playlistCacheGroup[key];
      return (cacheItem && cacheItem.value) || null;
    }
  }

  removeItem(group: string, key: string) {
    if (this.playlistCache[group] == null) {
      return;
    }
    if (this.playlistCache[group][key] == null) {
      return;
    }
    this.playlistCache[group][key] = null;
  }

  removeItemsInGroup(group: string) {
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
          // The + there eliminates TS complain
          const diff = +now - +ts; // difference in milliseconds
          if (diff >= cacheExpire) {
            this.playlistCache[groupName][itemName] = null;
          }
        }
      }
    }, 1000);
  }
}
