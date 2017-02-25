import ResourceLinksDto from './resourceLinks.dto';
import {ILinkDto} from './link.dto';
import {IFileInfoDto} from './fileInfo.dto';
import {IResourceLinksDto} from './resourceLinks.dto';

export interface IFolderContentDto {
  links: ILinkDto[]|IResourceLinksDto;
  files: IFileInfoDto[];
}

export interface IFolderContent {
  resourceLinksDto: IResourceLinksDto;
  files: IFileInfoDto[];
}

export default class FolderContentDto implements IFolderContentDto {
  links: ILinkDto[];
  files: IFileInfoDto[];

  constructor(data?: IFolderContent) {
    if (!data) return;

    if (data.resourceLinksDto) {
      var isDto = data.resourceLinksDto instanceof ResourceLinksDto;
      var isArray = data.resourceLinksDto instanceof Array;
      if (isDto) {
        this.links = data.resourceLinksDto.links;
      } else if (isArray) {
        this.links = data.resourceLinksDto;
      } else {
        throw new Error('links must be an Array');
      }
    }

    if (data.files) this.files = data.files;
  }

  setFiles(files: IFileInfoDto[]) {
    return new FolderContentDto({
      resourceLinksDto: this.links,
      files: files
    });
  }

  setLinks(links: ILinkDto[]) {
    return new FolderContentDto({
      resourceLinksDto: links,
      files: this.files
    });
  }
}
