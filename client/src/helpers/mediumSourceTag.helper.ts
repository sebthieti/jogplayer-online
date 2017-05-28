export default class MediumSourceTag {
  build(url: string, overrideExt?: string): HTMLSourceElement {
    const extIndex = url.lastIndexOf(".");
    const mediumExt = url.substring(extIndex);
    const ext = overrideExt || mediumExt;

    const srcTag = document.createElement('source');
    srcTag.id = "src_" + ext.substring(1);
    srcTag.src = this.buildUrl(url, overrideExt);
    const mimeType = this.getMimeTypeFromExt(ext);
    if (mimeType) {
      srcTag.type = mimeType;
    }

    return srcTag;
  }

  private getMimeTypeFromExt(ext: string): string {
    var mimeType = null;
    switch(ext) {
      case '.mp1':
      case '.mp2':
      case '.mp3':
      case '.mpg':
      case '.mpeg':
        mimeType = 'audio/mpeg';
        break;
      case '.oga':
      case '.ogg':
        mimeType = 'audio/ogg';
        break;
      case '.mp4':
      case '.m4a':
        mimeType = 'audio/mp4';
        break;
      case '.aac':
        mimeType = 'audio/aac';
        break;
      case '.wav':
        mimeType = 'audio/wav';
        break;
      case '.webm':
        mimeType = 'audio/webm';
        break;
      case '.flac':
        mimeType = 'audio/flac';
        break;
    }
    return mimeType;
  }

  private buildUrl(original: string, overrideExt: string): string {
    if (!overrideExt) {
      return original;
    }
    return original.substring(0, original.lastIndexOf(".")) +
      overrideExt;
  }
}
