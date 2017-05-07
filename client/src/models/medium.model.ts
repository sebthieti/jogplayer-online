import {inject} from 'aurelia-framework';
import {Medium} from '../entities/medium';
import PlaylistRepository from '../repositories/playlist.repository';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import MediaQueueService from '../services/mediaQueue.service';

// @inject(FileExplorerRepository)
export default class MediumModel {
  id?: string;
  title: string;
  index: number;
  isAvailable: boolean;
  isChecked: boolean;
  mimeType: string;
  duration: number;
  ext: string;
  url: string;

  constructor(
    private repository: FileExplorerRepository,
    private mediaQueueService: MediaQueueService,
    medium?: Medium
  ) { }

  // Was getMediumFromLinkUrl
  async setFromUrl(url: string): Promise<MediumModel> {
    const medium = await this.repository.getMediumFromUrl(url);
    Object.assign(this, {
      id: medium.id,
      duration: medium.duration,
      title: medium.title,
      isAvailable: medium.isAvailable,
      url
    });
    return this;

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

  playMedium() {
    this.mediaQueueService.enqueueMediumAndStartQueue(this);
  }
}
