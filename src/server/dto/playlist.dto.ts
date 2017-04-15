import {MediumDto} from './medium.dto';
import {Link} from '../entities/link';

export interface PlaylistDto {
  name: string;
  isAvailable: boolean;
  isVirtual: boolean;
  media: MediumDto[];
  links: Link[];
}
