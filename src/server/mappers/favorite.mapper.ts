import {IFavoriteModel} from '../models/favorite.model';
import {FavoriteDto} from '../dto/favorite.dto';

export default function toFavoriteDto(favorite: IFavoriteModel): FavoriteDto {
  return {
    name: favorite.name,
    folderPath: favorite.folderPath,
    links: favorite.links
  } as FavoriteDto;
}
