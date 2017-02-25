import * as id3 from 'id3js';

export default class MetaTagId3v1Service {
  static isOfTagVersionAsync(mediaFilePath): Promise<boolean> {
    return new Promise((resolve, onError) => {
      id3({
        file: mediaFilePath,
        type: id3.OPEN_LOCAL
      }, (err, tags) => {
        if (!err) {
          resolve(tags);
        } else {
          onError(true);
        }
      });
    });
  }

  static parseTagFromFileAsync(mediaFilePath) {
    return new Promise((resolve, reject) => {
      id3({
        file: mediaFilePath,
        type: id3.OPEN_LOCAL
      }, (err, tags) => {
        if (!err) {
          resolve(tags);
        } else {
          reject(err);
        }
      });
    });
  }
}
