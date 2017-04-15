import {IResourceLinksDto} from './resourceLinks.dto';
import {LinkDto} from './link.dto';

export interface IFileInfoDto {
  name: string;
  type: string;
  links: LinkDto[];
}

export interface IFileInfoDtoEntity {
  name: string;
  type: string;
  resourcesLinksDto: IResourceLinksDto;
}

export default class FileInfoDto implements IFileInfoDto {
  name: string;
  type: string;
  links: LinkDto[];

  constructor(data: IFileInfoDtoEntity) {
    if ('name' in data) this.name = data.name;
    if ('type' in data) this.type = data.type;
    if (data.resourcesLinksDto && data.resourcesLinksDto.links) {
      this.links = data.resourcesLinksDto.links;
    }
  }
}
