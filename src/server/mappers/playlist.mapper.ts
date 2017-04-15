import {IPlaylistModel} from '../models/playlist.model';
import {PlaylistDto} from '../dto/playlist.dto';
import toMediumDto from './medium.mapper';

export default async function toPlaylistDtoAsync(playlist: IPlaylistModel): Promise<PlaylistDto> {
  const media = await playlist.media.valueAsync;
  return {
    name: playlist.name,
    isAvailable: playlist.isAvailable,
    isVirtual: playlist.isVirtual,
    media: media.map(m => toMediumDto(m)),
    links: playlist.links
  } as PlaylistDto;
}
