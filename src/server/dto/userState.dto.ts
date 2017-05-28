import {Link} from '../entities/link';

export interface UserStateDto {
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistPosition: string;
  playingMediumInQueueIndex: number;
  links: Link[]
}
