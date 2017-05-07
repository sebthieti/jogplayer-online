export interface UserState {
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistIndex: number;
  playingMediumInQueueIndex: number;
}

export interface UpdateUserState {
  playedPosition?: number;
  mediaQueue?: string[];
  browsingFolderPath?: string;
  openedPlaylistIndex?: number;
  playingMediumInQueueIndex?: number;
}
