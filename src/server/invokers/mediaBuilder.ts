import * as path from 'path';
import MediaHelper from '../utils/mediaHelper';
import MediumSummary, {IMediumSummary} from '../entities/mediumSummary';
import {IMediaService} from '../services/media.service';
import {IMediumModel} from '../models/medium.model';
import {User} from '../models/user.model';
import Medium from '../entities/medium';

export interface IMediaBuilder {
  toMediaAsync(mediaSummaries: IMediumSummary[], playlistId: string, issuer: User): Promise<IMediumModel[]>;
  toMediumAsync(mediaSummary: IMediumSummary, playlistId: string, issuer: User): Promise<IMediumModel>;
  buildMediumAsync(playlistId: string, filePath: string, index: number, issuer: User): Promise<IMediumModel>;
  buildMediumSummary(
    filePath: string,
    title: string,
    index: number,
    duration: number
  ): IMediumSummary;
}

export default class MediaBuilder implements IMediaBuilder {
  private Media: IMediumModel;

  constructor(
    private mediaService: IMediaService,
    mediaModel: IMediumModel
  ) {
    this.Media = mediaModel;
  }

  toMediaAsync(mediaSummaries: IMediumSummary[], playlistId: string, issuer: User): Promise<IMediumModel[]> {
    const mediaPromises = mediaSummaries.map(mediumSummary =>
      this.toMediumAsync(mediumSummary, playlistId, issuer)
    );
    return Promise.all(mediaPromises);
  }

  toMediumAsync(mediaSummary: IMediumSummary, playlistId: string, issuer: User): Promise<IMediumModel> {
    if (!mediaSummary) {
      throw new Error('MediaBuilder.toMedia error: mediaSummary must be set');
    }
    return this.buildMediumAsync(playlistId, mediaSummary.filePath, mediaSummary.index, issuer);
  }

  async buildMediumAsync(playlistId: string, filePath: string, index: number, issuer: User): Promise<IMediumModel> {
    if (!filePath) {
      throw new Error('MediaBuilder.buildMedia: filePath not set');
    }
    const mimeType = MediaHelper.getMimeTypeFromPath(filePath);
    try {
      const mediumInfo = await this.mediaService.getMediumInfosAsync(filePath);
      const mediumFormat = mediumInfo.detailedInfo.format;

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
    } catch (err) { // Can happen when loading a playlist where media are not found
      const fileext = path.extname(filePath);
      const name = path.basename(filePath, fileext);

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
    }
  }

  buildMediumSummary(
    filePath: string,
    title: string,
    index: number,
    duration: number
  ): IMediumSummary {
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
