import {IMediumModel} from '../models/medium.model';
import {MediumDto} from '../dto/medium.dto';
import toLinkDto from './link.mapper';

export default function toMediumDto(medium: IMediumModel): MediumDto {
  return {
    id: medium._id.toString(),
    isChecked: medium.isChecked,
    isAvailable: medium.isAvailable,
    mediaType: medium.mediaType,
    mimeType: medium.mimeType,
    ext: medium.ext,
    title: medium.title,
    duration: medium.duration,
    filePath: medium.filePath,
    links: medium.links.map(l => toLinkDto(l))
  } as MediumDto;
}
