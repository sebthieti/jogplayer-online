import {LinkDto} from './link.dto';

export interface IResourceLinksDto {
  links: LinkDto[];
}

export default class ResourceLinksDto implements IResourceLinksDto {
  links: LinkDto[];

  static toDto(data?: IResourceLinksDto) {
    ResourceLinksDto.assertValidData(data);
    return new ResourceLinksDto(data);
  };

  static assertValidData(data: IResourceLinksDto) {
    if (data === undefined) {
      throw new Error('No data has been provided for resourceLinks');
    }

    if (data.links && !(data.links instanceof Array)) {
      throw new Error('links must be an Array');
    }
  }

  constructor(data?: IResourceLinksDto) {
    if (!data) return;
    if (data.links) this.links = data.links;
  }

  addLink(link) {
    if (!link) return this;

    let safeLinks = this.links || [];
    safeLinks.push(link);

    return new ResourceLinksDto({ links: safeLinks });
  }
}
