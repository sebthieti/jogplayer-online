import {Link} from '../entities/link';

export interface UserStateDto {
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistId: string;
  playingMediumInQueueIndex: number;
  links: Link[]
}
