import MediumModel from './medium.model';
import {MediumPlaylistLink} from '../entities/mediumPlaylistLink';
import {MediumInQueue} from '../entities/mediumInQueue';

export default class MediumInQueueModel {
  constructor(
    public medium: MediumModel,
    public playlistLink?: MediumPlaylistLink
  ) {}

  toEntity(): MediumInQueue {
    return {
      mediumPath: this.medium.filePath,
      playlistLink: this.playlistLink
    }
  }
}
