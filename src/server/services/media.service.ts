import * as fs from 'fs';
import {Stats} from 'fs';
import * as path from 'path';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fsHelpers from '../utils/fsHelpers';
import {nfcall} from '../utils/promiseHelpers';
import MediumInfo, {IMediumInfo} from '../entities/mediumInfo';
const ffprobe = ffmpeg.ffprobe;

export interface IMediaService {
  getFileSizeAsync(filePath);
  convertMediumToAsync(mediaFilePath, outputFormat);
  getFileStream(filePath, fromOffset, toOffset);
  getMediumInfosAsync(mediaFilePath): Promise<IMediumInfo>;
}

export default class MediaService implements IMediaService {
  getFileSizeAsync(filePath) {
    return nfcall(fs.stat, filePath)
      .then(
        (stat: Stats) => stat.size,
        err => console.log(err) // TODO File might not exists at that time
      );
  }

  convertMediumToAsync(mediaFilePath, outputFormat) {
    const outputFilePath = this.generateConvertedMediaFilePath(mediaFilePath, outputFormat);

    return fsHelpers
      .checkFileExistsAsync(outputFilePath)
      .then(fileAlreadyConverted => {
        if (fileAlreadyConverted) {
          return outputFilePath;
        }
        return this.ensureConvertionOutputFolderExistsAsync()
          .then(() => {
            return this.execMediumConvertionAsync (
              mediaFilePath,
              outputFormat,
              outputFilePath
            );
          });
      });
  }

  getFileStream(filePath, fromOffset, toOffset) {
    return fs.createReadStream(filePath, { start: fromOffset, end: toOffset });
  }

  getMediumInfosAsync(mediaFilePath): Promise<IMediumInfo> {
    return Promise
      .resolve(this.getBasicMediumInfo(mediaFilePath))
      .then(basicInfo => {
        return nfcall(ffprobe, mediaFilePath)
          .then(detailedMediumInfo => {
            return new MediumInfo({
                name: basicInfo.name,
                fileext: basicInfo.fileext,
                detailedInfo: detailedMediumInfo
            } as IMediumInfo);
          });
      });
  }

  private getBasicMediumInfo(filePath) {
    const fileext = path.extname(filePath);
    const name = path.basename(filePath, fileext);
    return { name: name, fileext: fileext };
  }

  private ensureConvertionOutputFolderExistsAsync() {
    return fsHelpers
      .checkFileExistsAsync(this.getConvertionOutputFolderPath())
      .then(this.ifNotExistsCreateConvertionOutputFolderAsync);
  }

  private getConvertionOutputFolderPath() {
    const convertionOutputFolderRelativePath = './_converted/';

    return path.join(
      process.cwd(),
      convertionOutputFolderRelativePath
    ); // or resolve ?
  }

  private ifNotExistsCreateConvertionOutputFolderAsync(folderExists) {
    if (!folderExists) {
      return nfcall(fs.mkdir, this.getConvertionOutputFolderPath());
    }
  }

  private execMediumConvertionAsync(mediaFilePath, outputFormat, outputFilePath) {
    // TODO try -map option (http://www.ffmpeg.org/ffmpeg.html)
    // TODO try -codec copy (http://www.ffmpeg.org/ffmpeg-all.html)
    // TODO try -t duration (output), -to position (output) (Xclusive Or), check interesting other next options
    const overwriteOutput = '-y';
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(mediaFilePath)
        .output(outputFilePath)
        .outputOptions(overwriteOutput)
        .on('end', () => resolve(outputFilePath))
        .on('error', err => reject(err))
        .run(); // TODO Maybe add somewhere the fact that medium has been converted, to avoid to do it again
    });
  }

  private generateConvertedMediaFilePath(mediaFilePath, outputFormat) {
    const ext = path.extname(mediaFilePath);

    const convertionFolderPath = this.getConvertionOutputFolderPath();
    const mediaFileNameNoExt = path.basename(mediaFilePath, ext);

    return path.join(convertionFolderPath, mediaFileNameNoExt + outputFormat);
  }

//var checkAndUpdateMustRelocalizeAsync = function(media) {
//	var checkAndUpdatePromises = media.map(function(medium) {
//		return utils.checkFileExistsAsync(medium.filePath)
//			.then(function (fileExists) { return setMustRelocalize(medium, fileExists) });
//	});
//	return Q.all(checkAndUpdatePromises);
//};
//
//var setMustRelocalize = function(medium, fileExists) {
//	return medium.setMustRelocalize(!fileExists);
//};

}
