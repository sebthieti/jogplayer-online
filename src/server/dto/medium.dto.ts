import {LinkDto} from './link.dto';

export interface MediumDto {
  id: string;
  isChecked: boolean;
  isAvailable: boolean;
  mediaType: string;
  mimeType: string;
  ext: string;
  title: string;
  duration: number;
  links: LinkDto[];
}
