export interface ILinkDto {
  rel: string;
  href: string;
}

export default class LinkDto implements ILinkDto {
  rel: string;
  href: string;

  constructor(data: ILinkDto) {
    this.rel = data.rel;
    this.href = data.href;
  };

  setRel(rel) { // TODO Use immutableJs for that
    return new LinkDto({rel, href: this.href});
  }

  setHref(href) {
    return new LinkDto({rel: this.rel, href});
  }
}
