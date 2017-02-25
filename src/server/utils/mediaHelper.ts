export default class MediaHelper {
  static getMimeTypeFromPath(mediaPath: string): string {
    let mimeType = 'audio/*';
    const ext = mediaPath.substring(mediaPath.lastIndexOf('.'));
    switch (ext) {
      case '.mp3':
        mimeType = 'audio/mpeg';
        break;
      case '.ogg':
        mimeType = 'audio/ogg';
        break;
    }
    return mimeType;
  }
}
