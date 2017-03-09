import * as fs from 'fs';
import {Stats} from 'fs';
import * as path from 'path';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fsHelpers from '../utils/fsHelpers';
import {nfcall} from '../utils/promiseHelpers';
import MediumInfo, {IMediumInfo} from '../entities/mediumInfo';
import {ReadStream} from 'fs';
const ffprobe = ffmpeg.ffprobe;

export interface IMediaService {
  getFileSizeAsync(filePath: string): Promise<number>;
  convertMediumToAsync(mediaFilePath: string, outputFormat: string): Promise<string>;
  getFileStream(filePath: string, fromOffset: number, toOffset: number): ReadStream;
  getMediumInfosAsync(mediaFilePath): Promise<IMediumInfo>;
}

export default class MediaService implements IMediaService {
  async getFileSizeAsync(filePath: string): Promise<number> {
    const stat = await nfcall<Stats>(fs.stat, filePath);
    return stat.size; // TODO File might not exists at that time
  }

  async convertMediumToAsync(mediaFilePath: string, outputFormat: string): Promise<string> {
    const outputFilePath = this.generateConvertedMediaFilePath(mediaFilePath, outputFormat);
    const fileAlreadyConverted = fsHelpers.checkFileExistsAsync(outputFilePath);
    if (fileAlreadyConverted) {
      return outputFilePath;
    }
    await this.ensureConvertionOutputFolderExistsAsync();
    return this.execMediumConvertionAsync (
      mediaFilePath,
      outputFormat,
      outputFilePath
    );
  }

  getFileStream(filePath: string, fromOffset: number, toOffset: number): ReadStream {
    return fs.createReadStream(filePath, { start: fromOffset, end: toOffset });
  }

  async getMediumInfosAsync(mediaFilePath: string): Promise<IMediumInfo> {
    const basicInfo = this.getBasicMediumInfo(mediaFilePath);
    const detailedMediumInfo = await nfcall(ffprobe, mediaFilePath);
    return new MediumInfo({
      name: basicInfo.name,
      fileext: basicInfo.fileext,
      detailedInfo: detailedMediumInfo
    } as IMediumInfo);
  }

  private getBasicMediumInfo(filePath: string): { name: string, fileext: string } {
    const fileext = path.extname(filePath);
    const name = path.basename(filePath, fileext);
    return { name: name, fileext: fileext };
  }

  private async ensureConvertionOutputFolderExistsAsync(): Promise<string> {
    const folderExists = await fsHelpers.checkFileExistsAsync(
      this.getConvertionOutputFolderPath()
    );
    return await this.ifNotExistsCreateConvertionOutputFolderAsync(folderExists);
  }

  private ifNotExistsCreateConvertionOutputFolderAsync(folderExists: boolean): Promise<string> {
    if (!folderExists) {
      return nfcall(fs.mkdir, this.getConvertionOutputFolderPath());
    }
  }

  private getConvertionOutputFolderPath(): string {
    const convertionOutputFolderRelativePath = './_converted/';

    return path.join(
      process.cwd(),
      convertionOutputFolderRelativePath
    ); // or resolve ?
  }

  private execMediumConvertionAsync(
    mediaFilePath: string,
    outputFormat: string,
    outputFilePath: string
  ): Promise<string> {
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

  private generateConvertedMediaFilePath(mediaFilePath: string, outputFormat: string): string {
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
