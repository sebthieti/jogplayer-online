import {Medium} from '../entities/medium';
import PlaylistRepository from '../repositories/playlist.repository';
import MediumModel from './medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import MediaQueueService from '../services/mediaQueue.service';

export default class PlaylistMediaModel {
  id: string;
  title: string;
  index: number;
  isAvailable: boolean;
  isChecked: boolean;
  mimeType: string;
  duration: number;
  ext: string;

  constructor(
    private repository: PlaylistRepository,
    private fileExplorerRepository: FileExplorerRepository,
    private mediaQueueService: MediaQueueService,
    medium?: Medium
  ) {
    Object.assign(this, medium);
  }

  getMediaFrom(playlistModel) {
    // var self = this;
    // return this.service
    //   .getByLinkAsync(playlistModel.selectActionFromLinks('media', playlistModel.links))
    //   .then(function(rawMedia) {
    //     self.validateArray(rawMedia, self.schema);
    //     var mediaModels = Model.build(self.endpointName, self.schema, rawMedia);
    //     mediaModels.forEach(function(medium) {
    //       medium.playlistId = playlistModel.id;
    //     });
    //     return mediaModels;
    //   });
  }

  async getMediumFromUrl(url: string): Promise<MediumModel> {
    const medium = await this.repository.getMediumByPath(url);
    return new MediumModel(this.fileExplorerRepository, this.mediaQueueService, medium);

    // var self = this;
    // return this.service
    //   .getByLinkAsync(mediumLinkUrl)
    //   .then(function(rawMedium) {
    //     self.validateSchema(rawMedium, self.schema);
    //     var mediumModels = Model.build(self.endpointName, self.schema, rawMedium);
    //     //mediaModels.forEach(function(medium) { // TODO What to do with that ?
    //     //	medium.playlistId = playlistModel.id;
    //     //});
    //     return mediumModels;
    //   });
  }
}
