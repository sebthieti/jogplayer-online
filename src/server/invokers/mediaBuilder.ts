import * as path from 'path';
import MediaHelper from '../utils/mediaHelper';
import MediumSummary, {IMediumSummary} from '../entities/mediumSummary';
import {IMediaService} from '../services/media.service';
import {IMediaModel} from '../models/media.model';

export interface IMediaBuilder {
  toMediaAsync(mediaSummaries, playlistId, issuer);
  toMediumAsync(mediaSummary, playlistId, issuer);
  buildMediumAsync(playlistId, filePath, index, issuer);
  buildMediumSummary(filePath, title, index, duration);
}

export default class MediaBuilder implements IMediaBuilder {
  private Media: IMediaModel;

  constructor(
    private mediaService: IMediaService,
    mediaModel: IMediaModel
  ) {
    this.Media = mediaModel;
  }

  toMediaAsync(mediaSummaries, playlistId, issuer) {
    const mediaPromises = mediaSummaries.map(mediumSummary =>
      this.toMediumAsync(mediumSummary, playlistId, issuer)
    );
    return Promise.all(mediaPromises);
  }

  toMediumAsync(mediaSummary, playlistId, issuer) {
    if (!mediaSummary) {
      throw new Error('MediaBuilder.toMedia error: mediaSummary must be set');
    }
    return this.buildMediumAsync(playlistId, mediaSummary.filePath, mediaSummary.index, issuer);
  }

  buildMediumAsync(playlistId, filePath, index, issuer) {
    if (!filePath) {
      throw new Error('MediaBuilder.buildMedia: filePath not set');
    }
    var mimeType = MediaHelper.getMimeTypeFromPath(filePath);
    return this.mediaService
      .getMediumInfosAsync(filePath)
      .then(mediumInfo => {
        var mediumFormat = mediumInfo.detailedInfo.format;
        return new this.Media({
          ownerId: issuer.id,
          _playlistId: playlistId,
          duration: Math.round(mediumFormat.duration),
          ext: mediumInfo.fileext,
          name: mediumInfo.name,
          index: index,
          filePath: mediumFormat.filename,
          checked: true,
          mimeType: mimeType,
          isAvailable: true,
          title: mediumInfo.name, // TODO Should also look for tag's title
          metadatas: [],
          bookmarks: []
        });
      }, err => { // Can happen when loading a playlist where media are not found
        var fileext = path.extname(filePath);
        var name = path.basename(filePath, fileext);
        return new this.Media({
          ownerId: issuer.id,
          _playlistId: playlistId,
          duration: 0,
          ext: fileext,
          name: name,
          index: index,
          filePath: filePath,
          checked: true,
          mimeType: mimeType,
          isAvailable: false,
          title: name
        });
      });
  }

  buildMediumSummary(filePath, title, index, duration) {
    if (!filePath) {
      throw new Error('MediaBuilder.buildMediaSummary: filePath not set');
    }
    return new MediumSummary({
      title,
      index,
      filePath,
      duration
    } as IMediumSummary);
  }
}

// TODO Uncomment the following for tag reading (maybe ffmpeg can do that)
//var determineMediaType = function (filePath) {
//	if (isAudioExtention(filePath)) {
//		return MediaType.AUDIO;
//	}
//	throw "Unhandled media extention (video files not supported)";
//};
//
//var isAudioExtention = function (filePath) {
//	if (!filePath) {
//		return false;
//	}
//	var fileExt = path.extname(filePath).toLowerCase();
//	switch (fileExt) {
//		case ".cda":
//		case ".flac":
//		case ".ogg":
//		case ".mp3":
//		case ".wav":
//		case ".wma":
//			return true;
//		default:
//			return false;
//	}
//};

//var metadatas = loadTags(filePath);
//
//var title = null;
//if (metadatas) {
//	title = findTitleFromTag(metadatas);
//}
//if (title == null) {
//	title = getTitleFromFilePath(filePath);
//}
//
////id, mediaType, title, filePath, duration, mustRelocalize, isSelected, bookmarks, metadatas
//return new Media(
//	Guid.Empty,
//	DetermineMediaType(filePath),
//	title,
//	filePath,
//	null
//)
//.SetMetadatas(metadatas)

//
//	 function findTitleFromTag(metadatas) {
//		 return from(metadatas)
//			 .select(function (tag) { return tag.title })
//			 .firstOrDefault();
//	 }
//
//	 function getTitleFromFilePath (filePath) {
//		 var fileNameExt = path.basename(filePath);
//		 var fileNameExtStartIndex = fileNameExt.lastIndexOf('.');
//		 return fileNameExt.slice(0, fileNameExtStartIndex);
//	 }
//
//	 function loadTags (filePath) {
//		 if (!fs.existsSync(filePath)) {
//			 return null;
//		 }
//		 return from(metaTagServices)
//			 .where(function (svc) {
//				 return svc
//					 .isOfTagVersionAsync(filePath)
//					 .then(function (isOfTagVersion) { return isOfTagVersion })
//					 .done();
//			 })
//			 .select(function (svc) {
//				 return svc
//					 .parseTagFromFileAsync(filePath)
//					 .then(function (tag) { return tag })
//					 .done();
//			 })
//			 .toArray();
//	 }
