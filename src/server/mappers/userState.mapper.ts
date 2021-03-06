import {IUserStateModel} from '../models/userState.model';
import {UserStateDto} from '../dto/userState.dto';

export default function toUserStateDto(userPermissions: IUserStateModel): UserStateDto {
  return {
    playedPosition: userPermissions.playedPosition,
    mediaQueue: userPermissions && userPermissions.mediaQueue,
    browsingFolderPath: userPermissions.browsingFolderPath,
    openedPlaylistPosition: userPermissions.openedPlaylistPosition,
    playingMediumInQueueIndex: userPermissions.playingMediumInQueueIndex,
    links: userPermissions.links
  } as UserStateDto;
}
