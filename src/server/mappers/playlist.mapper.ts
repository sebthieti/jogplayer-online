import {IPlaylistModel} from '../models/playlist.model';
import {PlaylistDto} from '../dto/playlist.dto';

export default function toPlaylistDto(playlist: IPlaylistModel): PlaylistDto {
  return {
    name: playlist.name,
    isAvailable: playlist.isAvailable,
    isVirtual: playlist.isVirtual,
    links: playlist.links
  } as PlaylistDto;
}
