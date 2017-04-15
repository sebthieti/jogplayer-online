import {Link} from '../entities/link';

export interface FavoriteDto {
  name: string;
  folderPath: string;
  links: Link[]
}
